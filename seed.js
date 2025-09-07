const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/smartcart', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Product = mongoose.model('Product', {
  barcode: String,
  name: String,
  price: Number
});

const products = [
  { barcode: "189943756592", name: "Milk Packet", price: 25 },
  { barcode: "218285417523", name: "Bread", price: 30 },
  { barcode: "142186738718", name: "Toothpaste", price: 45 },
  { barcode: "653706002047", name: "Soap Bar", price: 20 },
  { barcode: "495428788836", name: "Notebook", price: 50 },
  { barcode: "773557903680", name: "Chocolate", price: 35 }
];

Product.insertMany(products)
  .then(() => {
    console.log("Inserted successfully");
    mongoose.connection.close();
  })
  .catch(err => console.log("Insert failed", err));
