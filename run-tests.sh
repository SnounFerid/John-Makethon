#!/bin/bash

# Alert System Test Execution Script
# Run all tests with coverage reporting

set -e

echo "================================"
echo "Alert System Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in CI environment
if [ -n "$CI" ]; then
  echo "${BLUE}Running in CI mode${NC}"
  CI_MODE=true
else
  echo "${BLUE}Running in local mode${NC}"
  CI_MODE=false
fi

# Function to run backend tests
run_backend_tests() {
  echo ""
  echo "${YELLOW}Running Backend Tests...${NC}"
  echo "================================"
  
  cd backend
  
  if [ "$CI_MODE" = true ]; then
    npm run test:ci
  else
    npm test -- --coverage
  fi
  
  cd ..
  
  echo "${GREEN}✓ Backend tests completed${NC}"
}

# Function to run frontend tests
run_frontend_tests() {
  echo ""
  echo "${YELLOW}Running Frontend Tests...${NC}"
  echo "================================"
  
  cd frontend
  
  if [ "$CI_MODE" = true ]; then
    npm run test:ci
  else
    npm test -- --coverage --watchAll=false
  fi
  
  cd ..
  
  echo "${GREEN}✓ Frontend tests completed${NC}"
}

# Function to generate coverage summary
generate_coverage_summary() {
  echo ""
  echo "${YELLOW}Coverage Summary${NC}"
  echo "================================"
  
  if [ -f "backend/coverage/coverage-summary.json" ]; then
    echo "${BLUE}Backend Coverage:${NC}"
    # Extract coverage percentages from JSON
    node -e "
      const data = require('./backend/coverage/coverage-summary.json');
      const total = data.total;
      console.log('  Lines:      ' + total.lines.pct + '%');
      console.log('  Statements: ' + total.statements.pct + '%');
      console.log('  Functions:  ' + total.functions.pct + '%');
      console.log('  Branches:   ' + total.branches.pct + '%');
    "
  fi
  
  if [ -f "frontend/coverage/coverage-summary.json" ]; then
    echo "${BLUE}Frontend Coverage:${NC}"
    node -e "
      const data = require('./frontend/coverage/coverage-summary.json');
      const total = data.total;
      console.log('  Lines:      ' + total.lines.pct + '%');
      console.log('  Statements: ' + total.statements.pct + '%');
      console.log('  Functions:  ' + total.functions.pct + '%');
      console.log('  Branches:   ' + total.branches.pct + '%');
    "
  fi
}

# Function to check coverage thresholds
check_coverage_thresholds() {
  echo ""
  echo "${YELLOW}Checking Coverage Thresholds...${NC}"
  echo "================================"
  
  local backend_passed=true
  local frontend_passed=true
  
  # Check backend coverage (70% threshold)
  if [ -f "backend/coverage/coverage-summary.json" ]; then
    node -e "
      const data = require('./backend/coverage/coverage-summary.json');
      const total = data.total;
      const threshold = 70;
      
      if (total.lines.pct < threshold) {
        console.error('${RED}✗ Backend line coverage below threshold (${threshold}%)${NC}');
        process.exit(1);
      }
    " || backend_passed=false
  fi
  
  # Check frontend coverage (60% threshold)
  if [ -f "frontend/coverage/coverage-summary.json" ]; then
    node -e "
      const data = require('./frontend/coverage/coverage-summary.json');
      const total = data.total;
      const threshold = 60;
      
      if (total.lines.pct < threshold) {
        console.error('${RED}✗ Frontend line coverage below threshold (${threshold}%)${NC}');
        process.exit(1);
      }
    " || frontend_passed=false
  fi
  
  if [ "$backend_passed" = true ] && [ "$frontend_passed" = true ]; then
    echo "${GREEN}✓ All coverage thresholds met${NC}"
  else
    echo "${RED}✗ Coverage thresholds not met${NC}"
    return 1
  fi
}

# Function to generate HTML reports
generate_html_reports() {
  echo ""
  echo "${YELLOW}Generating HTML Coverage Reports...${NC}"
  echo "================================"
  
  if [ -d "backend/coverage/lcov-report" ]; then
    echo "${GREEN}✓ Backend coverage report: backend/coverage/lcov-report/index.html${NC}"
  fi
  
  if [ -d "frontend/coverage/lcov-report" ]; then
    echo "${GREEN}✓ Frontend coverage report: frontend/coverage/lcov-report/index.html${NC}"
  fi
}

# Function to upload to code coverage service
upload_coverage() {
  if [ "$CI_MODE" = true ] && [ -n "$CODECOV_TOKEN" ]; then
    echo ""
    echo "${YELLOW}Uploading Coverage to Codecov...${NC}"
    echo "================================"
    
    # Install codecov CLI
    npm install -g codecov
    
    # Upload coverage
    codecov -f "backend/coverage/lcov.info" -F backend
    codecov -f "frontend/coverage/lcov.info" -F frontend
    
    echo "${GREEN}✓ Coverage uploaded to Codecov${NC}"
  fi
}

# Main execution
main() {
  echo "${BLUE}Starting Alert System Tests${NC}"
  echo "Timestamp: $(date)"
  echo ""
  
  # Check if npm is installed
  if ! command -v npm &> /dev/null; then
    echo "${RED}Error: npm is not installed${NC}"
    exit 1
  fi
  
  # Run tests
  if ! run_backend_tests; then
    echo "${RED}Backend tests failed${NC}"
    exit 1
  fi
  
  if ! run_frontend_tests; then
    echo "${RED}Frontend tests failed${NC}"
    exit 1
  fi
  
  # Generate reports
  generate_coverage_summary
  
  if ! check_coverage_thresholds; then
    echo "${RED}Coverage thresholds not met${NC}"
    exit 1
  fi
  
  generate_html_reports
  upload_coverage
  
  echo ""
  echo "================================"
  echo "${GREEN}✓ All tests passed successfully!${NC}"
  echo "================================"
  echo ""
  
  # Exit with success
  exit 0
}

# Run main function
main "$@"
