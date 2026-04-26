const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderName: {
    type: String,
    required: true,
    trim: true
  },

  purchaser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Item', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true 
    },
    unitPrice: {
      type: Number,
      required: true
    }
  }],

  totalPrice: { 
    type: Number, 
    required: true 
  },

  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: false,
  },

  discountAmount: {
    type: Number,
    required: true,
    default: 0,
  },

  finalPrice: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    default: 'Pending'
  },

  orderDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);