const mongoose = require('mongoose');

const {
  Schema,
  model,
} = mongoose;

const productSchema = new Schema({
  id: {
    type: Number,
    ref: 'Product ID',
    // add default id to schema
  },
  name: {
    type: String,
    ref: 'Product Name',
    required: true,
  },
  price: {
    type: Number,
    ref: 'Product Price',
    required: true,
  },
  image: {
    type: String,
    ref: 'Product Image URL',
    required: true,
  },
  type: {
    type: String,
    ref: 'Product Type',
    enum: ['Desayuno', 'Almuerzo'],
    required: true,
  },
  dateEntry: {
    type: Date,
    ref: 'Product Entry Date',
    default: Date.now(),
  },
});

const Product = model('Product', productSchema);
module.exports = Product;
