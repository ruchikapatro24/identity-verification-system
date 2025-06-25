import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/main.css';

// Polyfill for older browsers
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function(constraints) {
    const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}

// Log browser capabilities
console.log("Browser camera support check:");
console.log("- navigator.mediaDevices:", !!navigator.mediaDevices);
console.log("- getUserMedia support:", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
console.log("- Browser:", navigator.userAgent);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 