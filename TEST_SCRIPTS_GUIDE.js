/**
 * Test Scripts Configuration Guide
 * Add these scripts to package.json files
 */

// Backend package.json - add to "scripts" section:
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:alerts": "jest __tests__/services/alertService.test.js",
    "test:routes": "jest __tests__/routes/alertRoutes.test.js",
    "test:integration": "jest __tests__/integration/alertSystemIntegration.test.js",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}

// Frontend package.json - add to "scripts" section:
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:components": "jest src/__tests__/components/",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}

// Root package.json - add to "scripts" section:
{
  "scripts": {
    "test": "npm test --prefix backend && npm test --prefix frontend",
    "test:all": "npm test --prefix backend && npm test --prefix frontend",
    "test:coverage": "npm run test:coverage --prefix backend && npm run test:coverage --prefix frontend",
    "test:watch": "concurrently \"npm run test:watch --prefix backend\" \"npm run test:watch --prefix frontend\"",
    "test:ci": "npm run test:ci --prefix backend && npm run test:ci --prefix frontend"
  }
}
