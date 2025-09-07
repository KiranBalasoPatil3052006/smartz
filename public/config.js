// config.js
// ✅ Auto-detect environment (local or Render)

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const BASE_URL = isLocalhost
  ? "http://localhost:5000"         // Local backend
  : "https://smartz.onrender.com";  // Render backend
