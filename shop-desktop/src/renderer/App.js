const { useState, useEffect } = React;

// API helper
const api = {
  async get(url) {
    const response = await fetch(`http://localhost:3456${url}`);
    return response.json();
  },
  async post(url, data) {
    const response = await fetch(`http://localhost:3456${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  async patch(url, data) {
    const response = await fetch(`http://localhost:3456${url}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// Setup Screen
function SetupScreen({ onSetupComplete }) {
  const [shopId, setShopId] = useState('');
  const [shopName, setShopName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await api.post('/api/setup', {
        shop_id: shopId,
        shop_name: shopName,
        api_key: apiKey
      });

      if (result.success) {
        onSetupComplete();
      } else {
        setError('Setup failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.setupContainer}>
      <div style={styles.setupBox}>
        <h1 style={styles.setupTitle}>☕ LoyalCup Shop Setup</h1>
        <p style={styles.setupSubtitle}>Configure your shop to start receiving orders</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Shop ID</label>
            <input
              type="text"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              placeholder="Enter your shop ID"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g., Corner Coffee Co."
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>

        <div style={styles.helpText}>
          <p>💡 Get your Shop ID and API Key from the LoyalCup dashboard</p>
          <p>📧 Need help? Contact support@loyalcup.com</p>
        </div>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({ order, onUpdateStatus }) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/api/orders/${order.id}/status`, { status: newStatus });
      onUpdateStatus();
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      preparing: '#2196F3',
      ready: '#4CAF50',
      completed: '#9E9E9E'
    };
    return colors[status] || '#9E9E9E';
  };

  const getNextStatus = (current) => {
    const flow = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'completed'
    };
    return flow[current];
  };

  const getNextStatusLabel = (current) => {
    const labels = {
      pending: 'Start Preparing',
      preparing: 'Mark Ready',
      ready: 'Complete Order'
    };
    return labels[current];
  };

  return (
    <div style={styles.orderCard}>
      <div style={styles.orderHeader}>
        <div>
          <h3 style={styles.orderNumber}>Order #{order.id.substring(0, 8)}</h3>
          <p style={styles.orderCustomer}>{order.customer_name}</p>
        </div>
        <div style={{...styles.statusBadge, backgroundColor: getStatusColor(order.status)}}>
          {order.status.toUpperCase()}
        </div>
      </div>

      <div style={styles.orderItems}>
        {order.items.map((item, idx) => (
          <div key={idx} style={styles.orderItem}>
            <span style={styles.itemQuantity}>{item.quantity}x</span>
            <span style={styles.itemName}>{item.name}</span>
            <span style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={styles.orderFooter}>
        <div style={styles.orderTotal}>
          <strong>Total: ${order.total.toFixed(2)}</strong>
        </div>
        <div style={styles.orderTime}>
          {new Date(order.created_at).toLocaleTimeString()}
        </div>
      </div>

      {order.status !== 'completed' && (
        <button
          onClick={() => handleStatusChange(getNextStatus(order.status))}
          disabled={updating}
          style={styles.actionButton}
        >
          {updating ? 'Updating...' : getNextStatusLabel(order.status)}
        </button>
      )}
    </div>
  );
}

// Dashboard Screen
function Dashboard({ shopConfig }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const statusFilter = filter === 'all' ? null : filter;
      const result = await api.get(`/api/orders${statusFilter ? `?status=${statusFilter}` : ''}`);
      setOrders(result.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    
    // Poll for new orders every 5 seconds
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const filterOrders = (status) => {
    return orders.filter(order => status === 'all' || order.status === status);
  };

  const activeOrders = filterOrders('pending').concat(filterOrders('preparing'));
  const readyOrders = filterOrders('ready');
  const completedOrders = filterOrders('completed');

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>☕ {shopConfig.shop_name}</h1>
          <p style={styles.headerSubtitle}>Shop Dashboard</p>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{activeOrders.length}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{readyOrders.length}</div>
            <div style={styles.statLabel}>Ready</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{orders.length}</div>
            <div style={styles.statLabel}>Total Today</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        {['all', 'pending', 'preparing', 'ready', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              ...styles.filterButton,
              ...(filter === status ? styles.filterButtonActive : {})
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div style={styles.loading}>Loading orders...</div>
      ) : (
        <div style={styles.ordersGrid}>
          {filterOrders(filter).length === 0 ? (
            <div style={styles.emptyState}>
              <h2>No {filter === 'all' ? '' : filter} orders</h2>
              <p>New orders will appear here automatically</p>
            </div>
          ) : (
            filterOrders(filter).map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={loadOrders}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Main App
function App() {
  const [configured, setConfigured] = useState(false);
  const [shopConfig, setShopConfig] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const config = await api.get('/api/config');
      setConfigured(config.configured);
      setShopConfig(config);
    } catch (err) {
      console.error('Failed to check config:', err);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div style={styles.loading}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!configured) {
    return <SetupScreen onSetupComplete={checkConfig} />;
  }

  return <Dashboard shopConfig={shopConfig} />;
}

// Styles
const styles = {
  // Setup Screen
  setupContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  setupBox: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  setupTitle: {
    fontSize: '32px',
    marginBottom: '10px',
    textAlign: 'center'
  },
  setupSubtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#333'
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.2s',
    outline: 'none'
  },
  submitButton: {
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px'
  },
  error: {
    padding: '12px',
    background: '#fee',
    color: '#c33',
    borderRadius: '8px',
    fontSize: '14px'
  },
  helpText: {
    marginTop: '30px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.6'
  },

  // Dashboard
  dashboard: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    background: 'white',
    padding: '30px 40px',
    borderBottom: '2px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: '28px',
    marginBottom: '5px'
  },
  headerSubtitle: {
    color: '#666',
    fontSize: '14px'
  },
  headerStats: {
    display: 'flex',
    gap: '30px'
  },
  stat: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px'
  },

  // Filters
  filters: {
    padding: '20px 40px',
    display: 'flex',
    gap: '10px',
    background: 'white',
    borderBottom: '1px solid #e0e0e0'
  },
  filterButton: {
    padding: '10px 20px',
    border: '2px solid #e0e0e0',
    background: 'white',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  filterButtonActive: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea'
  },

  // Orders Grid
  ordersGrid: {
    padding: '40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  orderCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px'
  },
  orderNumber: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  orderCustomer: {
    color: '#666',
    fontSize: '14px'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  orderItems: {
    borderTop: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0',
    padding: '15px 0',
    marginBottom: '15px'
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  itemQuantity: {
    fontWeight: 'bold',
    minWidth: '30px'
  },
  itemName: {
    flex: 1
  },
  itemPrice: {
    fontWeight: '600'
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  orderTotal: {
    fontSize: '18px'
  },
  orderTime: {
    color: '#666',
    fontSize: '14px'
  },
  actionButton: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },

  // Empty/Loading states
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666'
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  }
};

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);