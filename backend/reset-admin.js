const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 10);
    
    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hash, 'admin@krushiseva.com']
    );
    
    console.log('✅ Admin password reset successful!');
    console.log('Email: admin@krushiseva.com');
    console.log('Password: ' + password);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
  } finally {
    await connection.end();
  }
}

resetAdmin();
