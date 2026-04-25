const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET all customers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers WHERE is_active = TRUE';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR village LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY name';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single customer
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    
    // Get customer bill history
    const [bills] = await db.query(
      'SELECT id, bill_number, bill_date, total_amount, payment_status FROM bills WHERE customer_id = ? ORDER BY bill_date DESC LIMIT 10',
      [req.params.id]
    );
    
    res.json({ success: true, data: { ...rows[0], recent_bills: bills } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add customer
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, village, district, state, gstin } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Customer name is required' });

    const [result] = await db.query(
      'INSERT INTO customers (name, phone, email, address, village, district, state, gstin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, phone, email, address, village, district, state || 'Maharashtra', gstin]
    );

    res.status(201).json({ success: true, message: 'Customer added successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update customer
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, village, district, state, gstin } = req.body;

    await db.query(
      'UPDATE customers SET name=?, phone=?, email=?, address=?, village=?, district=?, state=?, gstin=? WHERE id=?',
      [name, phone, email, address, village, district, state, gstin, req.params.id]
    );

    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE customer (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE customers SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
