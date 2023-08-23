const mongoose = require('mongoose');

const { Schema } = mongoose;
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
  dataEntry: {
    type: Date,
    default: Date.now(),
  },
});

const Order = mongoose.model('Order', orderSchema);
exports.default = Order;
