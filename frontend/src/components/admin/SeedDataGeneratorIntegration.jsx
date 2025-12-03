import React from 'react';
import { Route } from 'react-router-dom';
import SeedDataGenerator from '../admin/SeedDataGenerator';

/**
 * Integration guide for Admin Dashboard
 * 
 * This file shows how to integrate the Seed Data Generator
 * into your existing admin dashboard
 */

// Option 1: Add as a route in your admin routing
export const adminRoutes = [
  {
    path: '/admin/seed-data',
    component: SeedDataGenerator,
    label: 'Seed Data Generator',
    icon: 'database',
    requiresAdmin: true
  }
];

// Option 2: Add to admin navigation menu
export const adminNavItems = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: 'dashboard'
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: 'people'
  },
  {
    label: 'Projects',
    path: '/admin/projects',
    icon: 'folder'
  },
  {
    label: 'Seed Data Generator',
    path: '/admin/seed-data',
    icon: 'database',
    badge: 'Dev Tool'
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: 'settings'
  }
];

// Option 3: Admin layout component example
export const AdminLayout = ({ user, children }) => {
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <nav className="admin-nav">
          {adminNavItems.map(item => (
            <a key={item.path} href={item.path} className="nav-item">
              {item.icon && <span className={`icon-${item.icon}`} />}
              {item.label}
              {item.badge && <span className="badge">{item.badge}</span>}
            </a>
          ))}
        </nav>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

// Option 4: Conditional rendering in existing admin panel
export const AdminPanel = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');

  return (
    <div className="admin-panel">
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'seed-data' ? 'active' : ''}`}
          onClick={() => setActiveTab('seed-data')}
        >
          Seed Data Generator
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && <DashboardContent />}
        {activeTab === 'seed-data' && <SeedDataGenerator />}
      </div>
    </div>
  );
};

// Option 5: Quick access from dashboard
export const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="card">
          <h3>System Statistics</h3>
          {/* Statistics content */}
        </div>

        <div className="card quick-actions">
          <h3>Quick Actions</h3>
          <ul>
            <li><a href="/admin/users">Manage Users</a></li>
            <li><a href="/admin/projects">Manage Projects</a></li>
            <li><a href="/admin/seed-data">Generate Test Data</a></li>
            <li><a href="/admin/settings">System Settings</a></li>
          </ul>
        </div>

        <div className="card">
          <h3>Development Tools</h3>
          <div style={{ padding: '1rem' }}>
            <p>Use the Seed Data Generator to quickly create test data:</p>
            <a 
              href="/admin/seed-data"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                marginTop: '0.5rem'
              }}
            >
              Open Seed Data Generator
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Option 6: Backend integration example
export const backendIntegration = `
// In your main server file (e.g., app.js or server.js)

const express = require('express');
const seedDataRoutes = require('./routes/admin/seedDataRoutes');
const { adminAuth } = require('./middleware/auth');

const app = express();

// Middleware
app.use(express.json());
app.use('/api/auth', authRoutes);

// Admin routes (protected)
app.use('/api/admin/seed-data', adminAuth, seedDataRoutes);
app.use('/api/admin/users', adminAuth, userRoutes);
app.use('/api/admin/projects', adminAuth, projectRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

// Option 7: Environment configuration
export const environmentConfig = {
  development: {
    API_BASE_URL: 'http://localhost:5000',
    ENABLE_SEED_GENERATOR: true,
    ALLOW_CLEAR_DATA: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: 'https://staging-api.example.com',
    ENABLE_SEED_GENERATOR: true,
    ALLOW_CLEAR_DATA: false,
    LOG_LEVEL: 'info'
  },
  production: {
    API_BASE_URL: 'https://api.example.com',
    ENABLE_SEED_GENERATOR: false,
    ALLOW_CLEAR_DATA: false,
    LOG_LEVEL: 'error'
  }
};

// Option 8: Feature flag usage
export const FeatureFlagExample = () => {
  const [features, setFeatures] = React.useState({
    seedDataGenerator: process.env.ENABLE_SEED_GENERATOR === 'true'
  });

  if (!features.seedDataGenerator) {
    return null;
  }

  return <SeedDataGenerator />;
};

// Option 9: Admin panel with permissions
export const AdminWithPermissions = ({ user }) => {
  const canAccessSeedData = 
    user?.role === 'admin' && 
    user?.permissions?.includes('generate:seed-data');

  return (
    <div className="admin-section">
      {canAccessSeedData ? (
        <SeedDataGenerator />
      ) : (
        <div className="access-denied">
          <p>You don't have permission to access this tool.</p>
          <p>Contact your administrator for access.</p>
        </div>
      )}
    </div>
  );
};

// Option 10: Integration test example
export const integrationTestExample = `
describe('Seed Data Generator Integration', () => {
  let adminToken;

  beforeAll(async () => {
    // Login as admin
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password'
      })
    });
    const data = await response.json();
    adminToken = data.token;
  });

  test('should generate seed data', async () => {
    const response = await fetch('/api/admin/seed-data/generate', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${adminToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numberOfUsers: 10,
        numberOfProjects: 5,
        numberOfTickets: 20,
        numberOfComments: 50,
        lowTickets: 40,
        mediumTickets: 40,
        highTickets: 20
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.usersCreated).toBe(10);
    expect(data.projectsCreated).toBe(5);
  });

  test('should validate distribution', async () => {
    const response = await fetch('/api/admin/seed-data/generate', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${adminToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numberOfUsers: 10,
        numberOfProjects: 5,
        numberOfTickets: 20,
        numberOfComments: 50,
        lowTickets: 50,
        mediumTickets: 50,
        highTickets: 50  // Invalid - totals 150
      })
    });

    expect(response.status).toBe(400);
  });

  test('should deny non-admin users', async () => {
    // Try with user token
    const response = await fetch('/api/admin/seed-data/generate', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${userToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ... })
    });

    expect(response.status).toBe(403);
  });
});
`;

export default {
  adminRoutes,
  adminNavItems,
  AdminLayout,
  AdminPanel,
  AdminDashboard,
  backendIntegration,
  environmentConfig,
  integrationTestExample
};
