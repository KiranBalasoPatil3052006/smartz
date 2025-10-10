const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { generateCashierCode } = require('./verifyCode'); // helper for cashier code

const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

/* ====================
   📌 MIDDLEWARE
==================== */
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

/* ====================
   📌 STATIC FILES
==================== */
const PUBLIC_DIR = path.join(__dirname, 'public');  
app.use(express.static(PUBLIC_DIR));

// Default route → CustomerLogin.html
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'CustomerLogin.html'));
});

/* ====================
   📌 DATABASE
==================== */
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

/* ====================
   📌 MODELS
==================== */
const productSchema = new mongoose.Schema({
  barcode: String,
  name: String,
  price: Number
});
const Product = mongoose.model('Product', productSchema);

const adminSchema = new mongoose.Schema({
  email: String,
  password: String
});
const Admin = mongoose.model('Admin', adminSchema);

const customerSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String
}, { timestamps: true });
const Customer = mongoose.model('Customer', customerSchema);

const purchaseSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  products: [
    { barcode: String, name: String, price: Number, quantity: Number }
  ],
  paymentMethod: String,
  cashierCode: String,
  date: { type: Date, default: Date.now }
});
const Purchase = mongoose.model('Purchase', purchaseSchema);

const cashIntentSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  cashierCode: String,
  date: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 15 * 60 * 1000) }
});
const CashIntent = mongoose.model('CashIntent', cashIntentSchema);

const cashierCodeHistorySchema = new mongoose.Schema({
  cashierCode: String,
  mobile: String,
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  createdAt: { type: Date, default: Date.now }
});
const CashierCodeHistory = mongoose.model('CashierCodeHistory', cashierCodeHistorySchema);

/* ====================
   📌 ROUTES
==================== */
// ======================
// 📦 PRODUCT MANAGEMENT
// ======================

// Add Product
app.post('/add-product', async (req, res) => {
  const { barcode, name, price } = req.body;
  if (!barcode || !name || !price)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    const existing = await Product.findOne({ barcode });
    if (existing)
      return res.status(400).json({ success: false, message: "Barcode already exists" });

    const product = new Product({ barcode, name, price });
    await product.save();
    res.json({ success: true, message: "✅ Product added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Get Product by Barcode
app.get('/product-manage/:barcode', async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Update Product
app.put('/update-product/:barcode', async (req, res) => {
  const { name, price } = req.body;
  try {
    const updated = await Product.findOneAndUpdate(
      { barcode: req.params.barcode },
      { name, price },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "✅ Product updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Delete Product
app.delete('/delete-product/:barcode', async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ barcode: req.params.barcode });
    if (!deleted) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "🗑️ Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Get all Products
app.get('/all-products', async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Product by barcode
app.get('/product/:barcode', async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin login
app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email, password });
    if (admin) res.json({ success: true, message: 'Login successful' });
    else res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save customer
app.post('/customer', async (req, res) => {
  const { name, mobile, email } = req.body;
  if (!name || !mobile || !email) return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    await Customer.findOneAndUpdate({ mobile }, { name, mobile, email }, { upsert: true, new: true });
    res.json({ success: true, message: 'Customer saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Get customers
app.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json([]);
  }
});

// Save purchase
app.post('/purchase', async (req, res) => {
  const { name, mobile, email, products, paymentMethod, cashierCode } = req.body;
  if (!name || !mobile || !products || !paymentMethod) return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    const purchase = new Purchase({ name, mobile, email, products, paymentMethod, cashierCode });
    if (paymentMethod === 'cash') await CashIntent.deleteOne({ mobile });
    await purchase.save();
    res.json({ success: true, message: 'Purchase saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving purchase' });
  }
});

// Purchase history
app.get('/purchase-history', async (req, res) => {
  try {
    const history = await Purchase.find().sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

// Cash purchases
app.get('/purchases/cash', async (req, res) => {
  try {
    const data = await Purchase.find({ paymentMethod: 'cash' }).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cash purchases' });
  }
});

// Online purchases
app.get('/purchases/online', async (req, res) => {
  try {
    const data = await Purchase.find({ paymentMethod: 'online' }).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching online purchases' });
  }
});

// Create cash intent
app.post('/cash-intent', async (req, res) => {
  const { name, mobile } = req.body;
  if (!name || !mobile) return res.status(400).json({ success: false, message: "Missing fields" });

  const cashierCode = generateCashierCode();
  try {
    await CashIntent.findOneAndUpdate(
      { mobile },
      { name, mobile, cashierCode, date: new Date(), expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
      { upsert: true, new: true }
    );
    await CashierCodeHistory.create({ cashierCode, mobile });
    res.json({ success: true, cashierCode });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saving cash intent' });
  }
});

// List cash intents
app.get('/cash-intents', async (req, res) => {
  try {
    const intents = await CashIntent.find().sort({ date: -1 });
    res.json(intents);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching intents' });
  }
});

// Verify cashier code
app.post('/verify-cashier-code', async (req, res) => {
  const { mobile, cashierCode } = req.body;
  try {
    const intent = await CashIntent.findOne({ mobile, cashierCode });
    if (!intent) return res.status(401).json({ success: false, message: '❌ Invalid code' });

    if (new Date() > intent.expiresAt) {
      await CashIntent.deleteOne({ mobile });
      return res.status(401).json({ success: false, message: '❌ Code expired' });
    }

    await CashIntent.deleteOne({ mobile });
    await CashierCodeHistory.updateOne({ mobile, cashierCode }, { $set: { verified: true, verifiedAt: new Date() } });

    res.json({ success: true, message: '✅ Code verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: '❌ Server error' });
  }
});

// Cashier code history
app.get('/cashier-code-history', async (req, res) => {
  try {
    const history = await CashierCodeHistory.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

/* ====================
   📌 START SERVER
==================== */
app.listen(PORT, () => console.log(`🚀 Server running at ${BASE_URL}`));
