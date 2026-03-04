const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConfig, setConfig, getOrders, updateOrderStatus } = require('./database');
const { initSync, syncOrderStatus } = require('./sync');

const app = express();
const PORT = 3456;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Get shop config
app.get('/api/config', async (req, res) => {
  try {
    const shopId = await getConfig('shop_id');
    const shopName = await getConfig('shop_name');
    
    res.json({
      configured: !!shopId,
      shop_id: shopId,
      shop_name: shopName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Setup shop
app.post('/api/setup', async (req, res) => {
  try {
    const { shop_id, shop_name, api_key } = req.body;
    
    await setConfig('shop_id', shop_id);
    await setConfig('shop_name', shop_name);
    await setConfig('api_key', api_key);
    
    // Initialize sync after setup
    await initSync();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await getOrders(status);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await updateOrderStatus(id, status);
    
    // Sync to cloud
    await syncOrderStatus(id, status);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from renderer directory
app.use(express.static(path.join(__dirname, '../renderer')));

// Start server
app.listen(PORT, () => {
  console.log(`Shop server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  
  // Initialize sync
  initSync().catch(console.error);
});