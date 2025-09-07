const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Define the Purchase Schema
const purchaseSchema = new mongoose.Schema({
  customerName: String,
  customerNumber: String,
  items: [
    {
      barcode: String,
      name: String,
      price: Number,
      quantity: Number,
    }
  ],
  date: { type: Date, default: Date.now }
});

// Model
const Purchase = mongoose.model("Purchase", purchaseSchema);

// POST route to save purchase
router.post("/", async (req, res) => {
  try {
    const { customerName, customerNumber, items } = req.body;
    const purchase = new Purchase({
      customerName,
      customerNumber,
      items,
      date: new Date()
    });
    await purchase.save();
    res.status(201).json({ message: "Purchase saved ✅" });
  } catch (err) {
    res.status(500).json({ message: "Error saving purchase ❌", error: err });
  }
});

// GET route (optional) to show purchase history
router.get("/", async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ date: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history ❌", error: err });
  }
});

module.exports = router;
