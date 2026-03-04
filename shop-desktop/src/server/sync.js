const axios = require('axios');
const WebSocket = require('ws');
const { getConfig, setConfig, createOrder } = require('./database');

const CLOUD_API_URL = process.env.CLOUD_API_URL || 'http://localhost:8000/api/v1';

let ws = null;
let shopId = null;
let apiKey = null;

// Initialize sync
async function initSync() {
  shopId = await getConfig('shop_id');
  apiKey = await getConfig('api_key');

  if (!shopId || !apiKey) {
    console.log('Shop not configured yet. Waiting for setup...');
    return;
  }

  console.log(`Initializing sync for shop: ${shopId}`);
  
  // Start WebSocket connection for real-time orders
  connectWebSocket();
  
  // Sync menu items from cloud
  await syncMenuItems();
}

// WebSocket connection for real-time orders
function connectWebSocket() {
  const wsUrl = CLOUD_API_URL.replace('http', 'ws') + `/ws/shop/${shopId}`;
  
  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('WebSocket connected to cloud backend');
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'new_order') {
        console.log('New order received:', message.order.id);
        await createOrder(message.order);
        
        // Notify frontend (via server-sent events or polling)
        broadcastNewOrder(message.order);
      }
    } catch (error) {
      console.error('Failed to process WebSocket message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected. Reconnecting in 5s...');
    setTimeout(connectWebSocket, 5000);
  });
}

// Sync menu items from cloud
async function syncMenuItems() {
  try {
    const response = await axios.get(`${CLOUD_API_URL}/shops/${shopId}/items`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Store menu items in local database
    // TODO: Implement menu item storage
    console.log('Menu items synced:', response.data.items.length);
  } catch (error) {
    console.error('Failed to sync menu items:', error.message);
  }
}

// Broadcast new order to connected clients
function broadcastNewOrder(order) {
  // This would broadcast to all connected web clients
  // For now, just log it
  console.log('Broadcasting new order to clients:', order.id);
}

// Update order status back to cloud
async function syncOrderStatus(orderId, status) {
  try {
    await axios.patch(
      `${CLOUD_API_URL}/orders/${orderId}`,
      { status },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    console.log(`Order ${orderId} status synced to cloud: ${status}`);
  } catch (error) {
    console.error('Failed to sync order status:', error.message);
  }
}

module.exports = {
  initSync,
  syncOrderStatus
};