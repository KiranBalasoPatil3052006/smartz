const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/smartcart', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const adminSchema = new mongoose.Schema({
  email: String,
  password: String
});
const Admin = mongoose.model('Admin', adminSchema);

const newAdmin = new Admin({
  email: 'adminlogin123@gmail.com',
  password: 'reset123'
});

newAdmin.save().then(() => {
  console.log('Admin created ✅');
  mongoose.connection.close();
});
