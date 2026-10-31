import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign iframe environment WebSocket / Vite HMR connection errors from bubbling up
window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  if (
    reason &&
    (reason === 'WebSocket closed without opened.' ||
      reason?.message?.includes('WebSocket') ||
      String(reason).includes('WebSocket'))
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
