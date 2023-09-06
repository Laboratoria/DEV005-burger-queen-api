const mongoose = require('mongoose');

const { Schema, model } = mongoose;
const orderSchema = new Schema({
  id: {
    type: Number,
    ref: 'Order ID',
  },
  userId: {
    type: Number,
    ref: 'User ID',
    required: true,
  },
  client: {
    type: String,
    ref: 'Client name',
    required: true,
  },
  table: {
    type: Number,
    ref: 'Table number',
    required: true,
  },
  products: [{
    qty: {
      type: Number,
      ref: 'Product amount',
      required: true,
    },
    product: {
      id: Number,
      name: String,
      price: Number,
      image: String,
      type: String,
      dateEntry: Date,
    },
  }],
  status: {
    type: String,
    enum: ['En preparación', 'Listo en barra', 'Entregado'],
    default: 'En  preparación',
  },
  dateEntry: {
    type: Date,
    default: Date.now(),
  },
});

const Order = model('Order', orderSchema);
module.exports = Order;
