const Order = require('../models/orderModel');
const Item = require('../models/itemModel');
const mongoose = require('mongoose');

// GET all orders for a user
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ purchaser: userId })
            .populate('purchaser', 'name email')
            .populate('items.product', 'name price');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
    }
};

// GET all orders (admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('purchaser', 'name email')
            .populate('items.product', 'name price');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
    }
};

// GET order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('purchaser', 'name email')
            .populate('items.product', 'name price');
        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pedido', error: error.message });
    }
};

// POST create order
const createOrder = async (req, res) => {
    try {
        const { orderName, purchaser, items } = req.body;

        if (!orderName || !purchaser || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Nome do pedido, comprador e items são obrigatórios' });
        }

        if (!mongoose.Types.ObjectId.isValid(purchaser)) {
            return res.status(400).json({ message: 'Comprador inválido' });
        }

        // Validate and calculate total
        let totalPrice = 0;
        const orderItems = [];

        for (let item of items) {
            const quantity = Number(item.quantity);

            if (!mongoose.Types.ObjectId.isValid(item.product)) {
                return res.status(400).json({ message: 'Produto inválido' });
            }

            if (!Number.isInteger(quantity) || quantity <= 0) {
                return res.status(400).json({ message: 'Quantidade deve ser um número inteiro maior que zero' });
            }

            const dbItem = await Item.findById(item.product);
            if (!dbItem) {
                return res.status(404).json({ message: `Item ${item.product} não encontrado` });
            }

            if (dbItem.stock < quantity) {
                return res.status(400).json({ message: `Estoque insuficiente para ${dbItem.name}` });
            }

            totalPrice += dbItem.price * quantity;
            orderItems.push({
                product: item.product,
                quantity,
                unitPrice: dbItem.price
            });

            // Decrease stock
            dbItem.stock -= quantity;
            await dbItem.save();
        }

        const newOrder = new Order({
            orderName,
            purchaser,
            items: orderItems,
            totalPrice,
            status: 'Pending'
        });

        await newOrder.save();
        const populatedOrder = await Order.findById(newOrder._id)
            .populate('purchaser', 'name email')
            .populate('items.product', 'name price');

        res.status(201).json(populatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar pedido', error: error.message });
    }
};

// PUT update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Canceled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Status inválido' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('purchaser', 'name email').populate('items.product', 'name price');

        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar pedido', error: error.message });
    }
};

// DELETE order
const deleteOrder = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'userId é obrigatório para deletar pedido' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        if (order.purchaser.toString() !== userId) {
            return res.status(403).json({ message: 'Você só pode apagar seus próprios pedidos' });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Pedido deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar pedido', error: error.message });
    }
};

module.exports = {
    getUserOrders, getAllOrders, getOrderById, createOrder, updateOrderStatus, deleteOrder
};
