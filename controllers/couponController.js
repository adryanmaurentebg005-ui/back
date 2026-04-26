const Coupon = require('../models/couponModel');

const getCoupons = async (_req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar cupons', error: error.message });
  }
};

const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Cupom nao encontrado' });
    }

    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar cupom', error: error.message });
  }
};

const createCoupon = async (req, res) => {
  const { code, discountType, discountValue, minOrderValue, expiresAt, isActive } = req.body;

  if (!code || !discountType || discountValue === undefined || !expiresAt) {
    return res.status(400).json({ message: 'Preencha os campos obrigatorios do cupom' });
  }

  try {
    const created = await Coupon.create({
      code: String(code).toUpperCase(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue ?? 0,
      expiresAt,
      isActive: isActive ?? true,
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar cupom', error: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.code) {
      payload.code = String(payload.code).toUpperCase();
    }

    const updated = await Coupon.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Cupom nao encontrado' });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao editar cupom', error: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Cupom nao encontrado' });
    }

    res.status(200).json({ message: 'Cupom deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar cupom', error: error.message });
  }
};

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
