const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET all categories
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add category
router.post('/categories', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
    res.status(201).json({ success: true, message: 'Category added', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.brand LIKE ? OR p.hsn_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }
    if (lowStock === 'true') {
      query += ' AND p.stock_quantity <= p.min_stock_alert';
    }
    query += ' ORDER BY p.name';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category_id, name, description, brand, unit, purchase_price, selling_price, gst_rate, hsn_code, stock_quantity, min_stock_alert } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO products (category_id, name, description, brand, unit, purchase_price, selling_price, gst_rate, hsn_code, stock_quantity, min_stock_alert)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, description, brand, unit, purchase_price, selling_price, gst_rate || 0, hsn_code, stock_quantity || 0, min_stock_alert || 10]
    );

    // Log initial stock movement
    if (stock_quantity > 0) {
      await db.query(
        'INSERT INTO stock_movements (product_id, movement_type, quantity, notes) VALUES (?, ?, ?, ?)',
        [result.insertId, 'purchase', stock_quantity, 'Initial stock entry']
      );
    }

    res.status(201).json({ success: true, message: 'Product added successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { category_id, name, description, brand, unit, purchase_price, selling_price, gst_rate, hsn_code, min_stock_alert, is_active } = req.body;
    
    await db.query(
      `UPDATE products SET category_id=?, name=?, description=?, brand=?, unit=?, purchase_price=?, selling_price=?, gst_rate=?, hsn_code=?, min_stock_alert=?, is_active=?
       WHERE id=?`,
      [category_id, name, description, brand, unit, purchase_price, selling_price, gst_rate, hsn_code, min_stock_alert, is_active !== undefined ? is_active : true, req.params.id]
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH update stock (purchase/adjustment)
router.patch('/:id/stock', authMiddleware, async (req, res) => {
  try {
    const { quantity, movement_type, notes, unit_price } = req.body;
    const productId = req.params.id;

    const [product] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
    if (product.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });

    let newQty;
    if (movement_type === 'purchase' || movement_type === 'return') {
      newQty = parseFloat(product[0].stock_quantity) + parseFloat(quantity);
    } else if (movement_type === 'adjustment') {
      newQty = parseFloat(quantity); // absolute value
    }

    await db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, productId]);
    await db.query(
      'INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, notes) VALUES (?, ?, ?, ?, ?)',
      [productId, movement_type, quantity, unit_price, notes]
    );

    res.json({ success: true, message: 'Stock updated', new_quantity: newQty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE product (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET stock movements for a product
router.get('/:id/movements', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
