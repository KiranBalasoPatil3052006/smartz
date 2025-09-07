// config.js
// Change 'environment' to 'production' when deploying to Render
const environment = 'development'; // 'development' or 'production'

const URLS = {
  development: "http://localhost:5000",
  production: "https://smartcart-2lvm.onrender.com"
};

const BASE_URL = URLS[environment];