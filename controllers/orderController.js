const Order = require('../models/orderModel');
const Item = require('../models/itemModel');
const Coupon = require('../models/couponModel');
const mongoose = require('mongoose');

const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Canceled'];

const populateOrder = (query) =>
    query
        .populate('purchaser', 'name email')
        .populate('author', 'name email')
        .populate('items.product', 'name price')
        .populate('coupon', 'code discountType discountValue');

const applyCoupon = async (couponCode, subtotal) => {
    if (!couponCode) {
        return { couponDoc: null, discountAmount: 0 };
    }

    const couponDoc = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
    if (!couponDoc || !couponDoc.isActive) {
        return { error: 'Cupom invalido ou inativo' };
    }

    if (new Date(couponDoc.expiresAt) < new Date()) {
        return { error: 'Cupom expirado' };
    }

    if (subtotal < Number(couponDoc.minOrderValue || 0)) {
        return { error: `Pedido nao atingiu o valor minimo de R$ ${Number(couponDoc.minOrderValue).toFixed(2)}` };
    }

    const discountAmount = couponDoc.discountType === 'percent'
        ? (subtotal * Number(couponDoc.discountValue)) / 100
        : Number(couponDoc.discountValue);

    return {
        couponDoc,
        discountAmount: Math.min(discountAmount, subtotal),
    };
};

const buildOrderItems = async (items) => {
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
        const quantity = Number(item.quantity);

        if (!mongoose.Types.ObjectId.isValid(item.product)) {
            return { error: 'Produto invalido' };
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return { error: 'Quantidade deve ser um numero inteiro maior que zero' };
        }

        const dbItem = await Item.findById(item.product);
        if (!dbItem) {
            return { error: `Item ${item.product} nao encontrado` };
        }

        if (dbItem.stock < quantity) {
            return { error: `Estoque insuficiente para ${dbItem.name}` };
        }

        totalPrice += dbItem.price * quantity;
        orderItems.push({
            product: item.product,
            quantity,
            unitPrice: dbItem.price,
        });
    }

    return { orderItems, totalPrice };
};

// GET all orders for a user
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await populateOrder(Order.find({ purchaser: userId }));
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
    }
};

// GET all orders (admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await populateOrder(Order.find());
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
    }
};

// GET order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await populateOrder(Order.findById(req.params.id));
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
        const { orderName, purchaser, items, couponCode, userId } = req.body;

        if (!orderName || !purchaser || !Array.isArray(items) || items.length === 0 || !userId) {
            return res.status(400).json({ message: 'Nome do pedido, comprador, items e userId são obrigatórios' });
        }

        if (!mongoose.Types.ObjectId.isValid(purchaser)) {
            return res.status(400).json({ message: 'Comprador inválido' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Autor inválido' });
        }

        const builtItems = await buildOrderItems(items);
        if (builtItems.error) {
            return res.status(400).json({ message: builtItems.error });
        }

        const couponResult = await applyCoupon(couponCode, builtItems.totalPrice);
        if (couponResult.error) {
            return res.status(400).json({ message: couponResult.error });
        }

        for (const item of items) {
            const dbItem = await Item.findById(item.product);
            dbItem.stock -= Number(item.quantity);
            await dbItem.save();
        }

        const finalPrice = builtItems.totalPrice - couponResult.discountAmount;

        const newOrder = new Order({
            orderName,
            purchaser,
            author: userId,
            items: builtItems.orderItems,
            totalPrice: builtItems.totalPrice,
            discountAmount: couponResult.discountAmount,
            finalPrice,
            coupon: couponResult.couponDoc?._id,
            status: 'Pending',
        });

        await newOrder.save();
        const populatedOrder = await populateOrder(Order.findById(newOrder._id));

        res.status(201).json(populatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar pedido', error: error.message });
    }
};

// PUT update order
const updateOrder = async (req, res) => {
    try {
        const { status, couponCode, userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'userId é obrigatório para editar pedido' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }

        const orderAuthorId = order.author ? order.author.toString() : order.purchaser.toString();
        if (orderAuthorId !== userId) {
            return res.status(403).json({ message: 'Você só pode editar seus próprios pedidos' });
        }

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Status inválido' });
        }

        const payload = {};
        if (status) {
            payload.status = status;
        }
        if (req.body.orderName) {
            payload.orderName = req.body.orderName;
        }

        if (Array.isArray(req.body.items) && req.body.items.length > 0) {
            const builtItems = await buildOrderItems(req.body.items);
            if (builtItems.error) {
                return res.status(400).json({ message: builtItems.error });
            }
            payload.items = builtItems.orderItems;
            payload.totalPrice = builtItems.totalPrice;
        }

        const subtotal = payload.totalPrice !== undefined ? payload.totalPrice : order.totalPrice;
        if (couponCode !== undefined) {
            if (!couponCode) {
                payload.coupon = null;
                payload.discountAmount = 0;
            } else {
                const couponResult = await applyCoupon(couponCode, subtotal);
                if (couponResult.error) {
                    return res.status(400).json({ message: couponResult.error });
                }
                payload.coupon = couponResult.couponDoc._id;
                payload.discountAmount = couponResult.discountAmount;
            }
        }

        const discountAmount = payload.discountAmount !== undefined ? payload.discountAmount : Number(order.discountAmount || 0);
        payload.finalPrice = subtotal - discountAmount;

        const updated = await Order.findByIdAndUpdate(req.params.id, payload, { new: true });
        const populated = await populateOrder(Order.findById(updated._id));

        res.status(200).json(populated);
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

        const orderAuthorId = order.author ? order.author.toString() : order.purchaser.toString();
        if (orderAuthorId !== userId) {
            return res.status(403).json({ message: 'Você só pode apagar seus próprios pedidos' });
        }

        await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Pedido deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar pedido', error: error.message });
    }
};

module.exports = {
    getUserOrders, getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder
};
