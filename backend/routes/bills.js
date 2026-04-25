const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Generate bill number
const generateBillNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `KSK/${year}-${month}/`;

  const [rows] = await db.query(
    "SELECT bill_number FROM bills WHERE bill_number LIKE ? ORDER BY id DESC LIMIT 1",
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastNum = parseInt(rows[0].bill_number.split('/').pop());
    nextNum = lastNum + 1;
  }
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

// GET all bills
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, startDate, endDate, payment_status, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT b.*, c.name as customer_name_ref
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (b.bill_number LIKE ? OR b.customer_name LIKE ? OR b.customer_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (startDate) { query += ' AND b.bill_date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND b.bill_date <= ?'; params.push(endDate); }
    if (payment_status) { query += ' AND b.payment_status = ?'; params.push(payment_status); }

    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);

    // Count total
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM bills WHERE 1=1' +
      (search ? ' AND (bill_number LIKE ? OR customer_name LIKE ?)' : ''),
      search ? [`%${search}%`, `%${search}%`] : []
    );

    res.json({ success: true, data: rows, total: countResult[0].total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single bill with items
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [bills] = await db.query('SELECT * FROM bills WHERE id = ?', [req.params.id]);
    if (bills.length === 0) return res.status(404).json({ success: false, message: 'Bill not found' });

    const [items] = await db.query('SELECT * FROM bill_items WHERE bill_id = ?', [req.params.id]);

    res.json({ success: true, data: { ...bills[0], items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new bill
router.post('/', authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      customer_id, customer_name, customer_phone, customer_address, customer_gstin,
      bill_date, items, payment_method, payment_status, amount_paid, notes, total_discount
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Bill items are required' });
    }

    // Calculate totals
    let subtotal = 0;
    let total_gst = 0;

    for (const item of items) {
      const discountedPrice = item.unit_price * item.quantity * (1 - (item.discount_percent || 0) / 100);
      const gstAmount = discountedPrice * (item.gst_rate || 0) / 100;
      subtotal += discountedPrice;
      total_gst += gstAmount;
    }

    const discountVal = parseFloat(total_discount || 0);
    const total_amount = subtotal + total_gst - discountVal;
    const amountPaid = parseFloat(amount_paid || total_amount);
    const amount_due = total_amount - amountPaid;

    const bill_number = await generateBillNumber();
    const formattedDate = new Date(bill_date || new Date()).toISOString().split('T')[0];

    // Insert bill
    const [billResult] = await connection.query(
      `INSERT INTO bills (bill_number, customer_id, customer_name, customer_phone, customer_address, customer_gstin,
        bill_date, subtotal, total_discount, total_gst, total_amount, payment_method, payment_status, amount_paid, amount_due, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bill_number, customer_id || null, customer_name, customer_phone, customer_address, customer_gstin,
        formattedDate, subtotal, discountVal, total_gst, total_amount,
        payment_method || 'cash', payment_status || 'paid', amount_paid !== undefined ? amount_paid : total_amount, amount_due, notes]
    );

    const billId = billResult.insertId;

    // Insert bill items & reduce stock
    for (const item of items) {
      const discountedBase = item.unit_price * item.quantity * (1 - (item.discount_percent || 0) / 100);
      const discount_amount = item.unit_price * item.quantity * (item.discount_percent || 0) / 100;
      const gst_amount = discountedBase * (item.gst_rate || 0) / 100;
      const total_price = discountedBase + gst_amount;

      await connection.query(
        `INSERT INTO bill_items (bill_id, product_id, product_name, hsn_code, unit, quantity, unit_price, discount_percent, discount_amount, gst_rate, gst_amount, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [billId, item.product_id || null, item.product_name, item.hsn_code, item.unit,
          item.quantity, item.unit_price, item.discount_percent || 0, discount_amount,
          item.gst_rate || 0, gst_amount, total_price]
      );

      // Reduce stock
      if (item.product_id) {
        await connection.query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
          [item.quantity, item.product_id, item.quantity]
        );
        await connection.query(
          'INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, reference_type, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [item.product_id, 'sale', item.quantity, billId, 'bill', `Sale - Bill ${bill_number}`]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Bill created successfully', id: billId, bill_number });
  } catch (error) {
    await connection.rollback();
    console.error('Bill creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// PUT update bill payment
router.patch('/:id/payment', authMiddleware, async (req, res) => {
  try {
    const { amount_paid, payment_status, payment_method } = req.body;
    const [bill] = await db.query('SELECT total_amount FROM bills WHERE id = ?', [req.params.id]);
    if (bill.length === 0) return res.status(404).json({ success: false, message: 'Bill not found' });

    const amount_due = bill[0].total_amount - amount_paid;
    await db.query(
      'UPDATE bills SET amount_paid=?, amount_due=?, payment_status=?, payment_method=? WHERE id=?',
      [amount_paid, amount_due, payment_status, payment_method, req.params.id]
    );
    res.json({ success: true, message: 'Payment updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE bill
router.delete('/:id', authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Restore stock
    const [items] = await connection.query('SELECT * FROM bill_items WHERE bill_id = ?', [req.params.id]);
    for (const item of items) {
      if (item.product_id) {
        await connection.query(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    await connection.query('DELETE FROM bills WHERE id = ?', [req.params.id]);
    await connection.commit();
    res.json({ success: true, message: 'Bill deleted and stock restored' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// POST settle multiple bills for a customer
router.post('/settle', authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { customer_name, customer_phone, amount_paid, payment_method = 'cash' } = req.body;

    if (!customer_name || !amount_paid) {
      return res.status(400).json({ success: false, message: 'Customer and amount are required' });
    }

    // Get all pending/partial bills for this customer
    const [unpaidBills] = await connection.query(
      `SELECT id, total_amount, amount_paid, amount_due 
       FROM bills 
       WHERE customer_name = ? AND customer_phone = ? AND payment_status IN ('pending', 'partial')
       ORDER BY bill_date ASC, id ASC`,
      [customer_name, customer_phone]
    );

    let remainingPayment = parseFloat(amount_paid);

    for (const bill of unpaidBills) {
      if (remainingPayment <= 0) break;

      const billDue = parseFloat(bill.amount_due);
      const paymentForThisBill = Math.min(remainingPayment, billDue);
      
      const newAmountPaid = parseFloat(bill.amount_paid) + paymentForThisBill;
      const newAmountDue = parseFloat(bill.total_amount) - newAmountPaid;
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

      await connection.query(
        'UPDATE bills SET amount_paid = ?, amount_due = ?, payment_status = ?, payment_method = ? WHERE id = ?',
        [newAmountPaid, newAmountDue, newStatus, payment_method, bill.id]
      );

      remainingPayment -= paymentForThisBill;
    }

    await connection.commit();
    res.json({ success: true, message: `Successfully settled ₹${amount_paid} across bills.` });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;

