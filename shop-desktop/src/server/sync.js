require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { getConfig, setConfig, createOrder } = require('./database');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let shopId = null;
let realtimeChannel = null;

// Initialize sync
async function initSync() {
  shopId = await getConfig('shop_id');

  if (!shopId) {
    console.log('Shop not configured yet. Waiting for setup...');
    return;
  }

  console.log(`Initializing sync for shop: ${shopId}`);
  
  // Start Supabase Realtime subscription for orders
  subscribeToOrders();
}

// Subscribe to real-time orders using Supabase
function subscribeToOrders() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }

  console.log(`Subscribing to orders for shop: ${shopId}`);

  realtimeChannel = supabase
    .channel('desktop-orders')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: `shop_id=eq.${shopId}`
      }, 
      async (payload) => {
        try {
          console.log('New order received:', payload.new.id);
          
          // Fetch full order with items
          const { data: order, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                *,
                menu_items (name, base_price)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;

          console.log('Full order data:', order);

          // Transform order items into the format expected by local database
          const items = order.order_items?.map(item => ({
            id: item.id,
            name: item.menu_items?.name || 'Unknown Item',
            quantity: item.quantity,
            price: item.unit_price
          })) || [];

          // Transform order data for local database
          const localOrder = {
            id: order.id,
            shop_id: order.shop_id,
            customer_id: order.customer_id,
            customer_name: order.customer_name || 'Guest',
            items: items, // ← PASS AS ARRAY, NOT STRING! database.js will stringify it
            total: order.total,
            status: order.status,
            payment_status: order.payment_status || 'pending',
            created_at: order.created_at,
            updated_at: order.updated_at
          };

          console.log('Saving order to local database:', localOrder);
          
          await createOrder(localOrder);
          console.log('✅ Order saved to local database successfully!');

          // Notify frontend (via polling)
          broadcastNewOrder(localOrder);
        } catch (error) {
          console.error('❌ Failed to process new order:', error);
          console.error('Error details:', error.message);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to order updates!');
      } else if (status === 'CLOSED') {
        console.log('❌ Subscription closed. Reconnecting...');
        setTimeout(subscribeToOrders, 5000);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error. Reconnecting...');
        setTimeout(subscribeToOrders, 5000);
      }
    });
}

// Broadcast new order to connected clients
function broadcastNewOrder(order) {
  // This would broadcast to all connected web clients
  // For now, just log it
  console.log('Broadcasting new order to clients:', order.id);
}

// Update order status back to Supabase
async function syncOrderStatus(orderId, status) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    console.log(`Order ${orderId} status synced to Supabase: ${status}`);
  } catch (error) {
    console.error('Failed to sync order status:', error.message);
  }
}

module.exports = {
  initSync,
  syncOrderStatus
};