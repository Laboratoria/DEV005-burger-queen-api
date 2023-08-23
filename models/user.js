const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
  id: {
    type: Number,
    ref: 'User ID',
  },
  email: {
    type: String,
    ref: 'User email',
    required: true,
  },
  password: {
    type: String,
    ref: 'User Password',
    required: true,
  },
  role: {
    type: String,
    ref: 'User Role',
    enum: ['admin', 'chef', 'waiter'],
    required: true,
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
