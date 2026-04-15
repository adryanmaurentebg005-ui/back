const express = require('express');
const router = express.Router();
const {
    getUserOrders,
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder
} = require('../controllers/orderController');

router.get('/user/:userId', getUserOrders);

router.get('/', getAllOrders);

router.get('/:id', getOrderById);

router.post('/', createOrder);

router.put('/:id', updateOrderStatus);

router.delete('/:id', deleteOrder);

module.exports = router;
