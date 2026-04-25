const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// GET dashboard summary
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    // Today's sales
    const [todaySales] = await db.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM bills WHERE bill_date = ?",
      [today]
    );

    // This month's sales
    const [monthSales] = await db.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM bills WHERE DATE_FORMAT(bill_date, '%Y-%m') = ?",
      [thisMonth]
    );

    // Total customers
    const [customers] = await db.query("SELECT COUNT(*) as count FROM customers WHERE is_active = TRUE");

    // Total products
    const [products] = await db.query("SELECT COUNT(*) as count FROM products WHERE is_active = TRUE");

    // Low stock products
    const [lowStock] = await db.query(
      "SELECT COUNT(*) as count FROM products WHERE is_active = TRUE AND stock_quantity <= min_stock_alert"
    );

    // Pending dues
    const [dues] = await db.query(
      "SELECT COALESCE(SUM(amount_due), 0) as total FROM bills WHERE payment_status IN ('partial', 'pending')"
    );

    // Recent bills
    const [recentBills] = await db.query(
      "SELECT b.id, b.bill_number, b.customer_name, b.total_amount, b.payment_status, b.bill_date FROM bills b ORDER BY b.created_at DESC LIMIT 5"
    );

    // Monthly sales chart (last 6 months)
    const [monthlySales] = await db.query(`
      SELECT DATE_FORMAT(bill_date, '%b %Y') as month, 
             COALESCE(SUM(total_amount), 0) as total,
             COUNT(*) as count
      FROM bills 
      WHERE bill_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(bill_date, '%b %Y'), DATE_FORMAT(bill_date, '%Y-%m')
      ORDER BY MIN(bill_date)
    `);

    // Top products by sales
    const [topProducts] = await db.query(`
      SELECT bi.product_name, SUM(bi.quantity) as total_qty, SUM(bi.total_price) as total_amount
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.bill_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY bi.product_name
      ORDER BY total_amount DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        today_sales: todaySales[0],
        month_sales: monthSales[0],
        total_customers: customers[0].count,
        total_products: products[0].count,
        low_stock_count: lowStock[0].count,
        pending_dues: dues[0].total,
        recent_bills: recentBills,
        monthly_sales: monthlySales,
        top_products: topProducts
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET sales report
router.get('/sales', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const start = startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    let groupFormat = '%Y-%m-%d';
    let groupLabel = 'DATE(bill_date)';
    if (groupBy === 'month') { groupFormat = '%Y-%m'; groupLabel = "DATE_FORMAT(bill_date, '%Y-%m')"; }
    if (groupBy === 'week') { groupFormat = '%Y-%u'; groupLabel = "YEARWEEK(bill_date)"; }

    const [salesData] = await db.query(`
      SELECT 
        DATE_FORMAT(bill_date, ?) as period,
        COUNT(*) as bill_count,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(total_gst), 0) as total_gst,
        COALESCE(SUM(total_discount), 0) as total_discount,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN payment_status='paid' THEN total_amount ELSE 0 END), 0) as collected,
        COALESCE(SUM(amount_due), 0) as pending
      FROM bills
      WHERE bill_date BETWEEN ? AND ?
      GROUP BY period
      ORDER BY MIN(bill_date)
    `, [groupFormat, start, end]);

    const [summary] = await db.query(`
      SELECT 
        COUNT(*) as total_bills,
        COALESCE(SUM(subtotal), 0) as total_subtotal,
        COALESCE(SUM(total_gst), 0) as total_gst,
        COALESCE(SUM(total_discount), 0) as total_discount,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(amount_paid), 0) as total_collected,
        COALESCE(SUM(amount_due), 0) as total_pending
      FROM bills
      WHERE bill_date BETWEEN ? AND ?
    `, [start, end]);

    res.json({ success: true, data: salesData, summary: summary[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET product-wise sales report
router.get('/product-sales', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const [rows] = await db.query(`
      SELECT 
        bi.product_name,
        bi.unit,
        bi.hsn_code,
        SUM(bi.quantity) as total_qty,
        SUM(bi.discount_amount) as total_discount,
        SUM(bi.gst_amount) as total_gst,
        SUM(bi.total_price) as total_amount
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.bill_date BETWEEN ? AND ?
      GROUP BY bi.product_name, bi.unit, bi.hsn_code
      ORDER BY total_amount DESC
    `, [start, end]);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET GST report
router.get('/gst', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const [rows] = await db.query(`
      SELECT 
        bi.gst_rate,
        bi.hsn_code,
        SUM(bi.quantity) as total_qty,
        SUM(bi.unit_price * bi.quantity) as taxable_amount,
        SUM(bi.gst_amount) as total_gst,
        SUM(bi.gst_amount) / 2 as cgst,
        SUM(bi.gst_amount) / 2 as sgst
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.bill_date BETWEEN ? AND ? AND bi.gst_rate > 0
      GROUP BY bi.gst_rate, bi.hsn_code
      ORDER BY bi.gst_rate
    `, [start, end]);

    const [total] = await db.query(`
      SELECT COALESCE(SUM(bi.gst_amount), 0) as total_gst
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.bill_date BETWEEN ? AND ?
    `, [start, end]);

    res.json({ success: true, data: rows, total_gst: total[0].total_gst });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET low stock report
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.name, p.brand, p.unit, p.stock_quantity, p.min_stock_alert, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE AND p.stock_quantity <= p.min_stock_alert
      ORDER BY (p.stock_quantity / p.min_stock_alert) ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET pending dues list
router.get('/pending-dues', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        customer_name, 
        customer_phone,
        COALESCE(SUM(amount_due), 0) as total_due,
        COUNT(*) as bill_count,
        MAX(bill_date) as last_bill_date
      FROM bills
      WHERE payment_status IN ('partial', 'pending')
      GROUP BY customer_name, customer_phone
      ORDER BY total_due DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;
