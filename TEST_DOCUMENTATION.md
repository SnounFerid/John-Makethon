# Alert System Testing Documentation

## Overview

Comprehensive test suite for the John Makethon Water Leak Detection Alert System. Tests cover unit tests, integration tests, and end-to-end scenarios across both backend and frontend.

## Test Structure

```
backend/
  __tests__/
    services/
      alertService.test.js          # Unit tests for AlertService
    routes/
      alertRoutes.test.js           # API endpoint tests
    integration/
      alertSystemIntegration.test.js # End-to-end workflows
    setup.js                        # Global test setup
  jest.config.js                   # Jest configuration

frontend/
  src/
    __tests__/
      components/
        AlertManagement.test.js     # React component tests
      setup.js                      # Jest setup for React
      fileMock.js                   # Asset mock
  jest.config.js                   # Frontend Jest config
```

## Running Tests

### Backend Tests

```bash
# Run all backend tests
npm test --prefix backend

# Run specific test file
npm test --prefix backend -- services/alertService.test.js

# Run with coverage
npm test --prefix backend -- --coverage

# Run in watch mode
npm test --prefix backend -- --watch
```

### Frontend Tests

```bash
# Run all frontend tests
npm test --prefix frontend

# Run specific test file
npm test --prefix frontend -- components/AlertManagement.test.js

# Run with coverage
npm test --prefix frontend -- --coverage

# Run in watch mode
npm test --prefix frontend -- --watch
```

### All Tests

```bash
# Run backend and frontend tests
npm run test:all

# Run with coverage report
npm run test:coverage
```

## Test Coverage Goals

### Backend
- **Lines**: 70%+
- **Branches**: 70%+
- **Functions**: 70%+
- **Statements**: 70%+

### Frontend
- **Lines**: 60%+
- **Branches**: 60%+
- **Functions**: 60%+
- **Statements**: 60%+

## Backend Tests

### AlertService Unit Tests (`alertService.test.js`)

Tests for core alert management functionality:

#### Alert Creation
- ✅ Create alert with correct properties
- ✅ Add alert to queue and history
- ✅ Trigger valve closure for critical/emergency alerts
- ✅ Skip valve closure for lower severity alerts
- ✅ Emit alert:created event
- ✅ Send notifications

**Metrics**: 6 tests, ~50 lines per test

#### Alert Retrieval
- ✅ Get all active alerts
- ✅ Filter by severity
- ✅ Filter by location
- ✅ Get unacknowledged alerts
- ✅ Get alerts by time range
- ✅ Get alert by ID
- ✅ Handle nonexistent alerts

**Metrics**: 7 tests

#### Alert Acknowledgment
- ✅ Acknowledge alert correctly
- ✅ Update acknowledgment stats
- ✅ Emit alert:acknowledged event
- ✅ Throw error for nonexistent alert

**Metrics**: 4 tests

#### Alert Resolution
- ✅ Resolve alert correctly
- ✅ Remove from active queue
- ✅ Track false positives
- ✅ Update resolution stats

**Metrics**: 4 tests

#### Feedback System
- ✅ Record feedback correctly
- ✅ Mark false positives
- ✅ Emit feedback:provided event

**Metrics**: 3 tests

#### Valve Closure
- ✅ Close valve for critical alerts
- ✅ Prevent duplicate closures
- ✅ Emit valve:closed event

**Metrics**: 3 tests

#### Notifications
- ✅ Send email for critical alerts
- ✅ Send SMS for critical alerts
- ✅ Send in-app for all alerts

**Metrics**: 3 tests

#### Statistics
- ✅ Calculate statistics correctly
- ✅ Track severity breakdown
- ✅ Calculate response time

**Metrics**: 3 tests

#### Audit Logging
- ✅ Create audit entries
- ✅ Get audit trail for alert
- ✅ Verify audit log integrity

**Metrics**: 3 tests

#### Cleanup
- ✅ Remove old alerts
- ✅ Keep recent alerts
- ✅ Reset system

**Metrics**: 3 tests

**Total**: 38+ tests for AlertService

### Alert Routes Tests (`alertRoutes.test.js`)

Integration tests for REST API endpoints:

#### Alert Creation Endpoints
- ✅ POST /create - Create alert
- ✅ POST /create-from-detection - Create from detection data
- ✅ Validate input data
- ✅ Trigger valve closure for critical

**Metrics**: 4 test suites

#### Alert Retrieval Endpoints
- ✅ GET /active - Get active alerts
- ✅ GET /unacknowledged - Get unacknowledged alerts
- ✅ GET /severity/:severity - Filter by severity
- ✅ GET /location/:location - Filter by location
- ✅ GET /:id - Get alert by ID

**Metrics**: 5 test suites with 15+ tests

#### Alert Action Endpoints
- ✅ POST /:id/acknowledge - Acknowledge alert
- ✅ POST /:id/resolve - Resolve alert
- ✅ POST /:id/feedback - Provide feedback
- ✅ Validate required fields
- ✅ Handle nonexistent alerts

**Metrics**: 3 test suites with 9+ tests

#### Statistics & Reporting
- ✅ GET /statistics/overview - Get statistics
- ✅ Verify all metrics included

**Metrics**: 1 test suite with 2 tests

#### Audit & Export
- ✅ GET /audit-log/complete - Get audit log
- ✅ GET /:id/audit-trail - Get alert's audit trail
- ✅ GET /export/:format - Export as JSON/CSV
- ✅ Validate format parameter

**Metrics**: 3 test suites with 7+ tests

#### Cleanup & Reset
- ✅ POST /clear-old/:days - Clear old alerts
- ✅ POST /reset - Reset system
- ✅ Verify data cleared

**Metrics**: 2 test suites with 3 tests

**Total**: 40+ tests for API routes

### Integration Tests (`alertSystemIntegration.test.js`)

End-to-end workflow tests:

#### Complete Workflows
- ✅ Full lifecycle: create → acknowledge → resolve
- ✅ Valve closure tracking
- ✅ Feedback collection throughout workflow

**Metrics**: 3 tests, complex scenarios

#### Multi-Alert Scenarios
- ✅ Multiple alerts at different severity levels
- ✅ Multiple alerts at same location
- ✅ Statistics calculation with multiple alerts

**Metrics**: 3 tests

#### Notification System
- ✅ Severity-based notification routing
- ✅ Notification details included
- ✅ Notification resending

**Metrics**: 3 tests

#### Audit Trail Integrity
- ✅ Complete detection-to-action chain
- ✅ Export without corruption
- ✅ Audit log consistency

**Metrics**: 2 tests

#### False Positive Handling
- ✅ Track false positives
- ✅ Use feedback for model improvement

**Metrics**: 2 tests

#### Performance
- ✅ Handle 100+ alerts efficiently
- ✅ Fast filtering operations
- ✅ Maintain audit integrity with many operations

**Metrics**: 2 tests

#### Error Handling
- ✅ Handle re-acknowledgment
- ✅ Handle re-resolution errors
- ✅ Validate severity levels

**Metrics**: 3 tests

**Total**: 18+ integration tests

## Frontend Tests

### AlertManagement Component (`AlertManagement.test.js`)

Comprehensive React component testing:

#### Component Rendering (5 tests)
- ✅ Render without crashing
- ✅ Display header
- ✅ Display statistics section
- ✅ Display tab navigation
- ✅ Display severity filter

#### Data Loading (5 tests)
- ✅ Fetch alerts on mount
- ✅ Fetch statistics on mount
- ✅ Display loading state
- ✅ Display alerts after loading
- ✅ Handle API errors

#### Statistics Display (7 tests)
- ✅ Display total alerts
- ✅ Display active count
- ✅ Display acknowledged count
- ✅ Calculate acknowledge rate
- ✅ Display false positives
- ✅ Display average response time
- ✅ Display valves closed

#### Alert Filtering (4 tests)
- ✅ Filter by severity
- ✅ Show all alerts
- ✅ Filter by warning
- ✅ Update on filter change

#### Tab Navigation (3 tests)
- ✅ Switch to All Alerts tab
- ✅ Switch to Unacknowledged tab
- ✅ Highlight active tab

#### Alert List Display (5 tests)
- ✅ Display alert cards
- ✅ Show severity badges
- ✅ Show timestamps
- ✅ Show location info
- ✅ Show acknowledgment status

#### Modal/Detail View (5 tests)
- ✅ Open modal on click
- ✅ Display alert details
- ✅ Show valve closure info
- ✅ Close modal on X click
- ✅ Display notifications sent

#### Acknowledge Action (3 tests)
- ✅ Show acknowledge button
- ✅ Call acknowledgeAlert API
- ✅ Refresh alerts after acknowledge

#### Resolve Action (2 tests)
- ✅ Show resolve button
- ✅ Display feedback form

#### Feedback Form (4 tests)
- ✅ Display feedback options
- ✅ Allow setting confidence
- ✅ Allow adding comments
- ✅ Submit feedback

#### Auto-refresh (2 tests)
- ✅ Refresh alerts periodically
- ✅ Refresh statistics periodically

#### Responsive Design (2 tests)
- ✅ Render statistics grid
- ✅ Stack on mobile

#### Error Handling (3 tests)
- ✅ Display error on fetch failure
- ✅ Handle acknowledge error
- ✅ Handle resolve error

**Total**: 50+ component tests

## Test Data

### Mock Alert Data

```javascript
{
  id: 'alert-1',
  timestamp: '2024-01-15T10:30:00Z',
  type: 'leak_detected',
  severity: 'critical',
  location: 'main_pipe',
  description: 'Critical leak detected',
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

## Continuous Integration

### GitHub Actions / CI Pipeline

```yaml
name: Alert System Tests

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
      
      - name: Run backend tests
        run: npm test --prefix backend -- --coverage
      
      - name: Run frontend tests
        run: npm test --prefix frontend -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Coverage Reports

### Generating Coverage

```bash
# Backend coverage
npm test --prefix backend -- --coverage

# Frontend coverage
npm test --prefix frontend -- --coverage

# Both with detailed reports
npm run test:coverage:html
```

Coverage reports are generated in:
- `backend/coverage/` - Backend coverage report
- `frontend/coverage/` - Frontend coverage report

### Viewing Reports

```bash
# Open HTML report in browser
open backend/coverage/lcov-report/index.html
open frontend/coverage/lcov-report/index.html
```

## Test Naming Conventions

### Unit Tests
```javascript
describe('ClassName', () => {
  describe('methodName', () => {
    test('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});
```

### Integration Tests
```javascript
describe('Feature Integration', () => {
  test('should [complete workflow] from [start] to [end]', () => {
    // Test implementation
  });
});
```

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should create alert"
```

### Run With Debug Output
```bash
npm test -- --verbose
```

### Use Node Debugger
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debug in VS Code
```json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names clearly describe expected behavior
3. **Mocking**: Mock external dependencies
4. **Setup/Teardown**: Use beforeEach/afterEach appropriately
5. **Assertions**: Use specific assertions
6. **Coverage**: Aim for >70% code coverage
7. **Performance**: Keep tests fast (<100ms each)
8. **Deterministic**: Tests should produce consistent results

## Troubleshooting

### Test Timeouts
- Increase timeout: `jest.setTimeout(15000)`
- Check for unresolved promises
- Verify mock implementations

### Flaky Tests
- Avoid hardcoding timestamps
- Don't depend on execution order
- Mock random values consistently

### Memory Leaks
- Clear event listeners in afterEach
- Reset mocks between tests
- Close database connections

### Coverage Not Reported
- Check include patterns in jest.config
- Verify files are actually executed
- Review ignored patterns

## Future Enhancements

1. **Performance Testing**
   - Add load tests for high alert volume
   - Benchmark critical operations

2. **Security Testing**
   - Add authorization tests
   - Verify input validation

3. **E2E Tests**
   - Add Cypress/Playwright tests
   - Test complete user workflows

4. **Visual Regression**
   - Add visual testing for UI changes
   - Screenshot comparisons

5. **Mutation Testing**
   - Use Stryker to verify test effectiveness
   - Improve test quality

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
