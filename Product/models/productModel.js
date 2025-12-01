const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  image: String,
  category: String,
  stock: { type: Number, default: 0 },
  variants: [
    {
      color: { type: String, required: true },
      stock: { type: Number, required: true, default: 0 },
      price: { type: Number, required: true },
      description: { type: String }
    }
  ]
});

module.exports = mongoose.model('Product', productSchema);