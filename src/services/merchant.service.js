const httpStatus = require('http-status');
const { Product, Order, Promotion, Merchant } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Ajouter un produit pour un commerçant.
 */
const addProduct = async (merchantId, productData) => {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Merchant not found');
  }

  const product = await Product.create({ ...productData, merchant: merchantId });
  merchant.products.push(product.id);
  await merchant.save();

  return product;
};

/**
 * Mettre à jour un produit.
 */
const updateProduct = async (merchantId, productId, updateData) => {
  const product = await Product.findOne({ _id: productId, merchant: merchantId });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found or not owned by merchant');
  }

  Object.assign(product, updateData);
  await product.save();

  return product;
};

/**
 * Supprimer un produit.
 */
const deleteProduct = async (merchantId, productId) => {
  const product = await Product.findOneAndDelete({ _id: productId, merchant: merchantId });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found or not owned by merchant');
  }

  await Merchant.findByIdAndUpdate(merchantId, { $pull: { products: productId } });
  return product;
};

/**
 * Désactiver un produit temporairement.
 */
const deactivateProduct = async (merchantId, productId) => {
  const product = await Product.findOne({ _id: productId, merchant: merchantId });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found or not owned by merchant');
  }

  product.isActive = false;
  await product.save();

  return product;
};

/**
 * Récupérer les commandes en attente avec filtres.
 */
const getPendingOrders = async (merchantId, filters) => {
  const { priority, status } = filters;

  const query = {
    merchant: merchantId,
    status: { $in: ['pending', 'processing'] },
  };

  if (priority) {
    query.priority = priority;
  }

  if (status) {
    query.status = status;
  }

  return await Order.find(query);
};

/**
 * Traiter une commande.
 */
const processOrder = async (merchantId, orderId, updateData) => {
  const order = await Order.findOne({ _id: orderId, merchant: merchantId });
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found or not owned by merchant');
  }

  Object.assign(order, updateData);
  await order.save();

  return order;
};

/**
 * Récupérer l'historique des commandes.
 */
const getOrderHistory = async (merchantId, filters) => {
  const { startDate, endDate, sortBy, order } = filters;

  const query = {
    merchant: merchantId,
    status: { $in: ['completed', 'cancelled'] },
  };

  if (startDate) {
    query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
  }

  if (endDate) {
    query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
  }

  return await Order.find(query).sort({ [sortBy]: order });
};

/**
 * Générer un rapport financier.
 */
const generateFinancialReport = async (merchantId, options) => {
  const { startDate, endDate } = options;

  const sales = await Order.find({
    merchant: merchantId,
    status: 'completed',
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  const totalRevenue = sales.reduce((sum, order) => sum + order.totalPrice, 0);

  return {
    totalRevenue,
    totalOrders: sales.length,
    startDate,
    endDate,
  };
};

/**
 * Récupérer les statistiques des ventes.
 */
const getSalesStats = async (merchantId, filters) => {
  const { startDate, endDate, region } = filters;

  const query = {
    merchant: merchantId,
    status: 'completed',
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  };

  if (region) {
    query['shippingAddress.region'] = region;
  }

  const sales = await Order.find(query);
  const totalRevenue = sales.reduce((sum, order) => sum + order.totalPrice, 0);

  return {
    totalRevenue,
    totalOrders: sales.length,
  };
};

/**
 * Récupérer le tableau de bord en temps réel.
 */
const getRealTimeDashboard = async (merchantId) => {
  const pendingOrders = await Order.countDocuments({ merchant: merchantId, status: 'pending' });
  const totalSales = await Order.countDocuments({ merchant: merchantId, status: 'completed' });

  return {
    pendingOrders,
    totalSales,
  };
};

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  deactivateProduct,
  getPendingOrders,
  processOrder,
  getOrderHistory,
  generateFinancialReport,
  getSalesStats,
  getRealTimeDashboard,
};
