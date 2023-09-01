const mongoose = require('mongoose');

const { Schema, model } = mongoose;
const orderSchema = new Schema({
  userId: {
    type: Number,
    ref: 'User',
    required: true,
  },
  client: String,
  table: Number,
  products: [{
    qty: {
      type: Number,
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
