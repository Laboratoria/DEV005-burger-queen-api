const mongoose = require('mongoose');

const {
  Schema,
  model,
} = mongoose;

const userSchema = new Schema({
  id: {
    type: Number,
    ref: 'User ID',
  },
  email: {
    type: String,
    ref: 'User email',
    required: true,
    unique: true,
  },
  password: {
    type: String,
    ref: 'User Password',
    required: true,
  },
  role: {
    role: {
      type: String,
      enum: ['admin', 'chef', 'waiter'],
      required: true,
    },
    admin: {
      type: Boolean,
    },
  },
});

const User = model('User', userSchema);
module.exports = User;
