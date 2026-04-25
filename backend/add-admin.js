const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function addAdmin(name, email, password) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Check if user already exists
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('❌ User with this email already exists!');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'admin']
    );

    console.log(' New Admin added successfully!');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('❌ Failed to add admin:', error.message);
  } finally {
    await connection.end();
  }
}

// Check arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node add-admin.js <name> <email> <password>');
  console.log('Example: node add-admin.js "John Doe" john@example.com mysecretpassword');
  process.exit(1);
}

const [name, email, password] = args;
addAdmin(name, email, password);
