const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
let dbPath;
try {
  const { app } = require('electron');
  dbPath = path.join(app.getPath('userData'), 'shop.db');
} catch (e) {
  // If electron is not available, use current directory
  dbPath = path.join(__dirname, '../../data/shop.db');
}

console.log('Database path:', dbPath);

// Create data directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
  } else {
    console.log('Database opened successfully');
  }
});

// Initialize database tables
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Shop configuration
      db.run(`
        CREATE TABLE IF NOT EXISTS config (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `, (err) => {
        if (err) console.error('Failed to create config table:', err);
        else console.log('Config table ready');
      });

      // Orders
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          shop_id TEXT,
          customer_id TEXT,
          customer_name TEXT,
          items TEXT,
          total REAL,
          status TEXT,
          payment_status TEXT,
          created_at TEXT,
          updated_at TEXT,
          synced INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) console.error('Failed to create orders table:', err);
        else console.log('Orders table ready');
      });

      // Menu items (synced from cloud)
      db.run(`
        CREATE TABLE IF NOT EXISTS menu_items (
          id TEXT PRIMARY KEY,
          name TEXT,
          description TEXT,
          price REAL,
          category TEXT,
          image_url TEXT,
          available INTEGER DEFAULT 1,
          synced_at TEXT
        )
      `, (err) => {
        if (err) console.error('Failed to create menu_items table:', err);
        else console.log('Menu items table ready');
      });

      // Workers
      db.run(`
        CREATE TABLE IF NOT EXISTS workers (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          role TEXT,
          created_at TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Failed to create workers table:', err);
          reject(err);
        } else {
          console.log('Workers table ready');
          console.log('All database tables initialized');
          resolve();
        }
      });
    });
  });
}

// Initialize on load
initDatabase().catch(console.error);

// Config helpers
function getConfig(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM config WHERE key = ?', [key], (err, row) => {
      if (err) {
        console.error('getConfig error:', err);
        reject(err);
      } else {
        resolve(row ? row.value : null);
      }
    });
  });
}

function setConfig(key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
      [key, value],
      (err) => {
        if (err) {
          console.error('setConfig error:', err);
          reject(err);
        } else {
          console.log(`Config set: ${key} = ${value}`);
          resolve();
        }
      }
    );
  });
}

// Order helpers
function createOrder(order) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO orders (id, shop_id, customer_id, customer_name, items, total, status, payment_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(
      sql,
      [
        order.id,
        order.shop_id,
        order.customer_id,
        order.customer_name || 'Guest',
        JSON.stringify(order.items),
        order.total,
        order.status || 'pending',
        order.payment_status || 'pending',
        order.created_at || new Date().toISOString(),
        new Date().toISOString()
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ id: order.id });
      }
    );
  });
}

function getOrders(status = null) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM orders';
    let params = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT 100';
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('getOrders error:', err);
        reject(err);
      } else {
        // Parse items JSON
        const orders = rows.map(row => ({
          ...row,
          items: JSON.parse(row.items)
        }));
        resolve(orders);
      }
    });
  });
}

function updateOrderStatus(orderId, status) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
      [status, new Date().toISOString(), orderId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

module.exports = {
  db,
  initDatabase,
  getConfig,
  setConfig,
  createOrder,
  getOrders,
  updateOrderStatus
};