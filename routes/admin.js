// routes/admin.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');

// Add admin manually (one-time use)
router.post('/create', async (req, res) => {
  try {
    const { email, password } = req.body;
    const newAdmin = new Admin({ email, password });
    await newAdmin.save();
    res.send('Admin created successfully');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
