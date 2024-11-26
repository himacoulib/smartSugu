const Joi = require('joi');
const { objectId } = require('./custom.validation');

const addProduct = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    price: Joi.number().required(),
    stock: Joi.number().integer().min(0).required(),
    category: Joi.string().optional(),
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      description: Joi.string(),
      price: Joi.number(),
      stock: Joi.number().integer().min(0),
      category: Joi.string(),
    })
    .min(1),
};

const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
  }),
};

const deactivateProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required(),
  }),
};

const getPendingOrders = {
  query: Joi.object().keys({
    priority: Joi.string().valid('high', 'medium', 'low').optional(),
    status: Joi.string().valid('pending', 'processing').optional(),
  }),
};

const processOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('processing', 'completed', 'cancelled').required(),
  }),
};

const getOrderHistory = {
  query: Joi.object().keys({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    sortBy: Joi.string().default('createdAt').optional(),
    order: Joi.string().valid('asc', 'desc').default('desc').optional(),
  }),
};

const generateFinancialReport = {
  query: Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  }),
};

const getSalesStats = {
  query: Joi.object().keys({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    region: Joi.string().optional(),
  }),
};

const getRealTimeDashboard = {
  // Pas de paramètres nécessaires, mais maintenons la structure pour cohérence.
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
