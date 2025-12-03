import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

console.log('[INDEX] Initializing React application');
console.log('[INDEX] Environment:', process.env.REACT_APP_API_URL || 'http://localhost:3000/api');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[INDEX] React app rendered successfully');
