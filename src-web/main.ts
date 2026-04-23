import './style.css';
import { invoke } from '@tauri-apps/api/core';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <h1>Claudio DJ</h1>
      <p>Welcome to Claudio DJ</p>
    `;
  }
});