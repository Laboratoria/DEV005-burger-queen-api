const mongoose = require('mongoose');

const getDateAndTime = () => {
  const now = new Date();
  return now.toISOString().replace(/[TZ]+/gm, ' ').substring(0, 19);
};

const {
  Schema,
  model,
} = mongoose;

const productSchema = new Schema({
  id: {
    type: String,
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
    type: String,
    ref: 'Product Entry Date',
    default: getDateAndTime(),
  },
});

const Product = model('Product', productSchema);
module.exports = Product;
