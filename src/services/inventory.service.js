const { Inventory, Product, Merchant } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Ajouter un produit à l'inventaire
 * @param {ObjectId} merchantId - ID du commerçant
 * @param {Object} productData - Données du produit
 * @returns {Promise<Inventory>}
 */
const addProduct = async (merchantId, productData) => {
  // Vérifier si le produit existe
  const product = await Product.findById(productData.productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Produit introuvable');
  }

  // Vérifier si le produit appartient déjà à l'inventaire du commerçant
  const existingInventory = await Inventory.findOne({ merchant: merchantId, product: product.id });
  if (existingInventory) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Ce produit est déjà dans l’inventaire');
  }

  // Créer un nouvel inventaire pour le produit
  const inventory = await Inventory.create({
    product: product.id,
    merchant: merchantId,
    quantity: productData.quantity || 0,
    lowStockThreshold: productData.lowStockThreshold || 5,
  });

  return inventory;
};

/**
 * Mettre à jour un produit dans l'inventaire
 * @param {ObjectId} merchantId - ID du commerçant
 * @param {ObjectId} productId - ID du produit
 * @param {Object} updateData - Données de mise à jour
 * @returns {Promise<Inventory>}
 */
const updateProduct = async (merchantId, productId, updateData) => {
  const inventory = await Inventory.findOne({ merchant: merchantId, product: productId });
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Produit non trouvé dans l’inventaire');
  }

  // Appliquer les mises à jour
  Object.assign(inventory, updateData);
  await inventory.save();

  return inventory;
};

/**
 * Mettre à jour le stock d’un produit
 * @param {ObjectId} merchantId - ID du commerçant
 * @param {ObjectId} productId - ID du produit
 * @param {Number} quantity - Quantité à ajouter/retirer
 * @returns {Promise<Inventory>}
 */
const updateStock = async (merchantId, productId, quantity) => {
  const inventory = await Inventory.findOne({ merchant: merchantId, product: productId });
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Produit non trouvé dans l’inventaire');
  }

  await inventory.updateQuantity(quantity);

  // Déclencher une alerte si le stock est faible
  if (inventory.isLowStock()) {
    // Logique pour notifier le commerçant (intégration avec notificationService)
  }

  return inventory;
};

/**
 * Supprimer un produit de l'inventaire
 * @param {ObjectId} merchantId - ID du commerçant
 * @param {ObjectId} productId - ID du produit
 * @returns {Promise<Inventory>}
 */
const deleteProduct = async (merchantId, productId) => {
  const inventory = await Inventory.findOne({ merchant: merchantId, product: productId });
  if (!inventory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Produit non trouvé dans l’inventaire');
  }

  await inventory.remove();

  return inventory;
};

/**
 * Obtenir l'inventaire complet d'un commerçant avec filtres et pagination
 * @param {ObjectId} merchantId - ID du commerçant
 * @param {Object} filters - Filtres (e.g., catégorie, stock minimal)
 * @returns {Promise<Object>}
 */
const getInventory = async (merchantId, filters = {}) => {
  const { page = 1, limit = 10, category, minStock } = filters;

  const query = { merchant: merchantId };
  if (category) {
    const productsInCategory = await Product.find({ category }).select('_id');
    query.product = { $in: productsInCategory.map((p) => p._id) };
  }
  if (minStock) {
    query.quantity = { $gte: minStock };
  }

  return Inventory.paginate(query, { page, limit, populate: 'product' });
};

/**
 * Récupérer des statistiques d'inventaire
 * @param {ObjectId} merchantId - ID du commerçant
 * @returns {Promise<Object>}
 */
const getInventoryStats = async (merchantId) => {
  const totalItems = await Inventory.countDocuments({ merchant: merchantId });
  const lowStockItems = await Inventory.countDocuments({
    merchant: merchantId,
    quantity: { $lt: mongoose.Types.Decimal128(lowStockThreshold) },
  });

  return {
    totalItems,
    lowStockItems,
  };
};

module.exports = {
  addProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getInventory,
  getInventoryStats,
};
