const mongoose = require('mongoose')
const Schema = mongoose.Schema


const orderSchema = new Schema({
    userId: { 
      type: Number, 
      ref: 'User', 
      required: true
    },
    client: String,
    table: Number, 
    products: [{
      qty: { 
        type: Number, 
        required: true 
      },              
      product: {
        id: Number,
        name: String,
        price: Number,
        image: String,
        type: String,
        dateEntry: Date
      },
    }],
    status: { 
        type: String, 
        enum: ['En preparación', 'Listo en barra', 'Entregado'], 
        default: 'En  preparación' 
    },
    dataEntry: { 
        type: Date, 
        default: Date.now()
    },
  });
  
  module.exports = mongoose.model('Order', orderSchema);

  module.exports = Order;
  