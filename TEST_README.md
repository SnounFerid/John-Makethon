# Alert System Test Suite - Complete Guide

## 📋 Overview

Complete test suite for the John Makethon Water Leak Detection Alert System with **100+ tests** covering:
- Unit tests for services and utilities
- Integration tests for API endpoints
- End-to-end workflow tests
- React component tests
- Error handling and edge cases

## 📦 Test Files Created

### Backend Tests

#### 1. **alertService.test.js** (38+ tests)
Location: `backend/__tests__/services/alertService.test.js`

Core business logic tests:
- Alert creation with properties validation
- Alert queue and history management
- Severity-based filtering and routing
- Valve closure automation
- Acknowledgment system
- Resolution and feedback
- Notification dispatch
- Statistics calculation
- Audit logging
- Data cleanup

#### 2. **alertRoutes.test.js** (40+ tests)
Location: `backend/__tests__/routes/alertRoutes.test.js`

REST API endpoint tests:
- POST endpoints (create, acknowledge, resolve, feedback)
- GET endpoints (active, unacknowledged, by severity/location)
- Statistics and reporting endpoints
- Audit log and export endpoints
- Cleanup and reset operations
- Error handling for invalid inputs
- HTTP status code validation

#### 3. **alertSystemIntegration.test.js** (18+ tests)
Location: `backend/__tests__/integration/alertSystemIntegration.test.js`

End-to-end workflow tests:
- Complete alert lifecycle workflows
- Multi-alert scenarios
- Notification system integration
- Audit trail integrity
- False positive detection and feedback
- Performance testing (100+ alerts)
- Error scenarios and edge cases

### Frontend Tests

#### 4. **AlertManagement.test.js** (50+ tests)
Location: `frontend/src/__tests__/components/AlertManagement.test.js`

React component tests:
- Component rendering and structure
- Data loading and API integration
- Statistics display and calculations
- Alert filtering by severity
- Tab navigation functionality
- Alert list display with details
- Modal/detail view interactions
- Alert acknowledgment actions
- Alert resolution workflow
- Feedback form functionality
- Auto-refresh mechanisms
- Responsive design
- Error handling

### Configuration Files

#### 5. **jest.config.js** (Backend)
Location: `backend/jest.config.js`
- Node test environment
- Coverage thresholds: 70%
- Test file patterns

#### 6. **jest.config.js** (Frontend)
Location: `frontend/jest.config.js`
- jsdom test environment
- Module name mapping for CSS/assets
- Coverage thresholds: 60%
- CSS module mocking

#### 7. **setup.js** (Backend)
Location: `backend/__tests__/setup.js`
- Global test configuration
- Console mocking
- Helper utilities
- Test data builders

#### 8. **setup.js** (Frontend)
Location: `frontend/src/__tests__/setup.js`
- React Testing Library setup
- DOM mocking (localStorage, sessionStorage)
- Window API mocks
- Jest DOM extensions

#### 9. **fileMock.js**
Location: `frontend/src/__tests__/fileMock.js`
- Static asset mocking for tests

### Documentation

#### 10. **TEST_DOCUMENTATION.md**
Complete testing guide with:
- Test structure and organization
- Running tests (local and CI)
- Coverage goals and reports
- Test descriptions and metrics
- Mock data examples
- CI/CD integration
- Best practices
- Troubleshooting guide

#### 11. **TEST_SCRIPTS_GUIDE.js**
npm scripts configuration guide for:
- Backend test commands
- Frontend test commands
- Root-level test orchestration
- CI/CD pipeline scripts

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install --save-dev jest supertest

# Frontend dependencies
cd ../frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2. Run Tests

```bash
# All tests
npm test

# Backend only
npm test --prefix backend

# Frontend only
npm test --prefix frontend

# Specific test file
npm test -- alertService.test.js

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### 3. View Coverage

```bash
# Generate coverage reports
npm test -- --coverage

# Open HTML report
open backend/coverage/lcov-report/index.html
```

## 📊 Test Statistics

| Category | Count | Coverage | Status |
|----------|-------|----------|--------|
| Unit Tests | 38+ | AlertService | ✅ Complete |
| API Tests | 40+ | REST Routes | ✅ Complete |
| Integration Tests | 18+ | End-to-End | ✅ Complete |
| Component Tests | 50+ | React UI | ✅ Complete |
| **Total** | **146+** | **Multiple** | **✅ Complete** |

## 🧪 Test Coverage Goals

### Backend
- Lines: **70%+**
- Branches: **70%+**
- Functions: **70%+**
- Statements: **70%+**

### Frontend
- Lines: **60%+**
- Branches: **60%+**
- Functions: **60%+**
- Statements: **60%+**

## 📝 Test Categories

### Alert Service Tests (38 tests)

```javascript
✅ Alert Creation (6 tests)
  - Properties validation
  - Queue/history management
  - Valve closure for critical
  - Event emission
  - Notification dispatch

✅ Alert Retrieval (7 tests)
  - Get active alerts
  - Filter by severity/location/time
  - Get by ID
  - Error handling

✅ Acknowledgment (4 tests)
  - Record acknowledgment
  - Update stats
  - Event emission
  - Error cases

✅ Resolution (4 tests)
  - Mark as resolved
  - Remove from queue
  - Track false positives
  - Update statistics

✅ Feedback System (3 tests)
  - Record feedback
  - False positive tracking
  - Model improvement data

✅ Valve Closure (3 tests)
  - Trigger closure
  - Prevent duplicates
  - Event emission

✅ Notifications (3 tests)
  - Email dispatch
  - SMS dispatch
  - In-app dispatch

✅ Statistics (3 tests)
  - Calculate metrics
  - Severity breakdown
  - Response times

✅ Audit Logging (3 tests)
  - Entry creation
  - Audit trail retrieval
  - Integrity verification

✅ Cleanup (3 tests)
  - Remove old alerts
  - Keep recent
  - System reset
```

### API Routes Tests (40 tests)

```javascript
✅ Create Endpoints (4 tests)
  - POST /create
  - POST /create-from-detection
  - Input validation
  - Valve closure

✅ Retrieval Endpoints (9+ tests)
  - GET /active
  - GET /unacknowledged
  - GET /severity/:severity
  - GET /location/:location
  - GET /:id
  - Time range queries

✅ Action Endpoints (9+ tests)
  - POST /:id/acknowledge
  - POST /:id/resolve
  - POST /:id/feedback
  - POST /:id/resend-notifications
  - Error handling

✅ Statistics (2 tests)
  - GET /statistics/overview
  - Metric validation

✅ Audit & Export (7+ tests)
  - GET /audit-log/complete
  - GET /:id/audit-trail
  - GET /export/:format
  - Format validation

✅ Cleanup (3 tests)
  - POST /clear-old/:days
  - POST /reset
  - Data verification
```

### Integration Tests (18 tests)

```javascript
✅ Complete Workflows (3 tests)
  - Create → Acknowledge → Resolve
  - Valve closure tracking
  - Feedback collection

✅ Multi-Alert Scenarios (3 tests)
  - Different severity levels
  - Same location handling
  - Statistics with multiple alerts

✅ Notifications (3 tests)
  - Severity-based routing
  - Detail inclusion
  - Resending

✅ Audit Integrity (2 tests)
  - Detection-to-action chain
  - Export consistency

✅ False Positives (2 tests)
  - Tracking
  - Model improvement

✅ Performance (2 tests)
  - Handle 100+ alerts
  - Maintain integrity

✅ Error Handling (3 tests)
  - Re-acknowledgment
  - Re-resolution
  - Severity validation
```

### Component Tests (50 tests)

```javascript
✅ Rendering (5 tests)
  - Component loads
  - Header displays
  - Statistics visible
  - Navigation present
  - Filters shown

✅ Data Loading (5 tests)
  - Fetch on mount
  - Loading states
  - Display alerts
  - Error handling
  - API calls

✅ Statistics Display (7 tests)
  - Total count
  - Active count
  - Acknowledged count
  - Rate calculation
  - False positives
  - Response time
  - Valve closures

✅ Filtering (4 tests)
  - By severity
  - Show all
  - Update on change
  - Multiple filters

✅ Tab Navigation (3 tests)
  - Switch tabs
  - Highlight active
  - Filter integration

✅ Alert List (5 tests)
  - Display cards
  - Severity badges
  - Timestamps
  - Location info
  - Status display

✅ Modal Details (5 tests)
  - Open/close
  - Display details
  - Valve info
  - Notifications list
  - Form elements

✅ Acknowledge Action (3 tests)
  - Button display
  - API call
  - Refresh data

✅ Resolve Action (2 tests)
  - Button display
  - Feedback form

✅ Feedback Form (4 tests)
  - Options display
  - Confidence slider
  - Comments input
  - Submission

✅ Auto-Refresh (2 tests)
  - Periodic updates
  - Stats refresh

✅ Responsive Design (2 tests)
  - Grid layout
  - Mobile stacking

✅ Error Handling (3 tests)
  - Display errors
  - Handle API failures
  - Recovery
```

## 🔧 Configuration Details

### Jest Configuration (Backend)

```javascript
{
  testEnvironment: 'node',
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testTimeout: 10000
}
```

### Jest Configuration (Frontend)

```javascript
{
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__tests__/fileMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
}
```

## 📚 Test Data Fixtures

### Mock Alert

```javascript
{
  id: 'alert-1',
  timestamp: '2024-01-15T10:30:00Z',
  type: 'leak_detected',
  severity: 'critical',
  location: 'main_pipe',
  description: 'Critical leak detected',
  value: 25,
  threshold: 5,
  confidence: 0.95,
  status: 'active',
  acknowledged: false,
  resolved: false,
  valveClosureTriggered: true,
  notificationsSent: ['email', 'sms', 'slack', 'inApp']
}
```

### Mock Statistics

```javascript
{
  total: 10,
  active: 5,
  acknowledged: 3,
  acknowledgeRate: '60.0',
  resolved: 2,
  falsePositives: 1,
  averageResponseTime: 120,
  valvesClosedCount: 2,
  severityBreakdown: {
    info: 1,
    warning: 2,
    critical: 5,
    emergency: 2
  }
}
```

## 🎯 Key Features Tested

### Core Functionality
- ✅ Alert creation and lifecycle
- ✅ Severity-based routing
- ✅ Automatic valve closure
- ✅ Multi-channel notifications
- ✅ User acknowledgment
- ✅ Alert resolution
- ✅ Feedback collection
- ✅ Audit logging

### User Interactions
- ✅ View active alerts
- ✅ Filter by severity/location
- ✅ Acknowledge alerts
- ✅ Resolve alerts
- ✅ Provide feedback
- ✅ View statistics
- ✅ Export audit logs
- ✅ Review alert details

### Edge Cases
- ✅ Duplicate acknowledgment
- ✅ Resolving resolved alert
- ✅ Invalid severity levels
- ✅ Nonexistent alert IDs
- ✅ API errors
- ✅ Network failures
- ✅ Invalid input data
- ✅ Concurrent operations

## 🔍 Running Specific Tests

```bash
# Run all AlertService tests
npm test -- alertService.test.js

# Run single test suite
npm test -- --testNamePattern="should create alert"

# Run tests matching pattern
npm test -- --testNamePattern="valve"

# Run with verbose output
npm test -- --verbose

# Run with coverage for specific file
npm test -- --coverage --collectCoverageFrom="services/alertService.js"
```

## 📈 Coverage Reports

```bash
# Generate HTML coverage report
npm test -- --coverage

# View in browser
open coverage/lcov-report/index.html

# Generate LCOV format for CI
npm test -- --coverage --coverage-reporters=lcov
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Alert System

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [14, 16, 18]
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## 🐛 Debugging Tests

```bash
# Debug mode
npm test -- --debug

# Run in Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Single test in watch mode
npm test -- --testNamePattern="should create alert" --watch

# Show full error details
npm test -- --verbose
```

## ✅ Validation Checklist

- [x] 100+ tests implemented
- [x] Multiple test categories (unit, integration, component)
- [x] Mock data and fixtures included
- [x] Coverage configuration set (70%+ backend, 60%+ frontend)
- [x] Jest configurations created
- [x] Setup files for test environment
- [x] Documentation and guides
- [x] CI/CD integration examples
- [x] Error handling tests
- [x] Edge case coverage

## 📖 Next Steps

1. **Install test dependencies**
   ```bash
   npm install --save-dev jest supertest @testing-library/react
   ```

2. **Update package.json** with test scripts from TEST_SCRIPTS_GUIDE.js

3. **Run tests**
   ```bash
   npm test
   ```

4. **Review coverage**
   ```bash
   npm test -- --coverage
   ```

5. **Set up CI/CD** using GitHub Actions or similar

6. **Add to deployment pipeline** to ensure tests pass before deployment

## 📞 Support

For test-related issues:
1. Check TEST_DOCUMENTATION.md for detailed information
2. Review specific test file comments
3. Check Jest documentation: https://jestjs.io/
4. Review React Testing Library: https://testing-library.com/react

---

**Total Tests Created**: 146+ comprehensive tests  
**Coverage**: Unit, Integration, E2E, and Component tests  
**Status**: ✅ Ready for use
