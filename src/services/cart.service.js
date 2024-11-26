const { Cart, Product } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Obtenir le panier d'un utilisateur
 * @param {ObjectId} clientId - L'ID de l'utilisateur (client)
 * @returns {Promise<Cart>}
 */
const getCartDetails = async (clientId) => {
  const cart = await Cart.findOne({ client: clientId }).populate('items.product');
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
  }
  return cart;
};

/**
 * Ajouter un produit au panier
 * @param {ObjectId} clientId - L'ID de l'utilisateur
 * @param {Object} itemData - Données de l'article (productId, quantity)
 * @returns {Promise<Cart>}
 */
const addToCart = async (clientId, itemData) => {
  const { productId, quantity } = itemData;
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  if (quantity > product.stock) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient product stock');
  }

  let cart = await Cart.findOne({ client: clientId });

  if (!cart) {
    cart = await Cart.create({ client: clientId });
  }

  await cart.addItem(productId, quantity);
  return cart;
};

/**
 * Mettre à jour la quantité d'un produit dans le panier
 * @param {ObjectId} clientId - L'ID de l'utilisateur
 * @param {ObjectId} productId - L'ID du produit
 * @param {Number} quantity - Nouvelle quantité
 * @returns {Promise<Cart>}
 */
const updateCartItem = async (clientId, productId, quantity) => {
  const cart = await Cart.findOne({ client: clientId });

  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  await cart.updateItemQuantity(productId, quantity);
  return cart;
};

/**
 * Supprimer un produit du panier
 * @param {ObjectId} clientId - L'ID de l'utilisateur
 * @param {ObjectId} productId - L'ID du produit à supprimer
 * @returns {Promise<Cart>}
 */
const removeFromCart = async (clientId, productId) => {
  const cart = await Cart.findOne({ client: clientId });

  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  await cart.removeItem(productId);
  return cart;
};

/**
 * Vider le panier après la création d'une commande
 * @param {ObjectId} clientId - L'ID de l'utilisateur
 * @returns {Promise<Cart>}
 */
const clearCart = async (clientId) => {
  const cart = await Cart.findOne({ client: clientId });

  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  await cart.clearCart();
  return cart;
};

/**
 * Vérifier si un produit est présent dans le panier
 * @param {ObjectId} clientId - L'ID de l'utilisateur
 * @param {ObjectId} productId - L'ID du produit
 * @returns {Promise<Boolean>}
 */
const containsProduct = async (clientId, productId) => {
  const cart = await Cart.findOne({ client: clientId });

  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  return cart.containsProduct(productId);
};

module.exports = {
  getCartDetails,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  containsProduct,
};
