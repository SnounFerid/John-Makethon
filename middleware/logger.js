const morgan = require('morgan');

// Create a custom token for detailed request logging
morgan.token('custom-log', (req, res) => {
  return `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${res.responseTime.toFixed(3)}ms`;
});

// Morgan middleware for request logging
const requestLogger = morgan((tokens, req, res) => {
  const method = tokens.method(req, res);
  const path = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res);
  const timestamp = new Date().toISOString();

  return `[${timestamp}] ${method} ${path} ${status} ${responseTime}ms`;
});

module.exports = {
  requestLogger
};
