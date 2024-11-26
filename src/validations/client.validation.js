const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createClient = {
  body: Joi.object().keys({
    user: Joi.string().required().custom(objectId),
    addresses: Joi.array().items(
      Joi.object().keys({
        address: Joi.string().trim().required(),
        coordinates: Joi.object().keys({
          latitude: Joi.number().required(),
          longitude: Joi.number().required(),
        }),
      })
    ),
    orders: Joi.array().items(Joi.string().custom(objectId)),
    cart: Joi.string().custom(objectId),
    refunds: Joi.array().items(
      Joi.object().keys({
        orderId: Joi.string().custom(objectId).required(),
        reason: Joi.string().required(),
        status: Joi.string().valid('pending', 'approved', 'rejected'),
        date: Joi.date(),
      })
    ),
    ratings: Joi.array().items(
      Joi.object().keys({
        orderId: Joi.string().custom(objectId).required(),
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().optional(),
      })
    ),
    feedback: Joi.array().items(Joi.string().custom(objectId)),
    notifications: Joi.array().items(Joi.string().custom(objectId)),
  }),
};

const getClient = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
};

const updateClientProfile = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      user: Joi.string().custom(objectId),
      addresses: Joi.array().items(
        Joi.object().keys({
          address: Joi.string().trim(),
          coordinates: Joi.object().keys({
            latitude: Joi.number(),
            longitude: Joi.number(),
          }),
        })
      ),
    })
    .min(1),
};

const addAddress = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    address: Joi.string().trim().required(),
    coordinates: Joi.object().keys({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    }),
  }),
};

const updateAddress = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
    addressId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      address: Joi.string().trim(),
      coordinates: Joi.object().keys({
        latitude: Joi.number(),
        longitude: Joi.number(),
      }),
    })
    .min(1),
};

const deleteAddress = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
    addressId: Joi.string().required().custom(objectId),
  }),
};

const placeOrder = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    items: Joi.array()
      .items(
        Joi.object().keys({
          productId: Joi.string().required().custom(objectId),
          quantity: Joi.number().required().min(1),
        })
      )
      .required(),
    totalAmount: Joi.number().required().min(0),
    addressId: Joi.string().required().custom(objectId),
  }),
};

const cancelOrder = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
    orderId: Joi.string().required().custom(objectId),
  }),
};

const getOrderHistory = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date(),
    sortBy: Joi.string(),
    order: Joi.string().valid('asc', 'desc'),
  }),
};

const requestRefund = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    orderId: Joi.string().required().custom(objectId),
    reason: Joi.string().required(),
  }),
};

const addRating = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    orderId: Joi.string().required().custom(objectId),
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().optional(),
  }),
};

const getRatings = {
  params: Joi.object().keys({
    clientId: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  createClient,
  getClient,
  updateClientProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  placeOrder,
  cancelOrder,
  getOrderHistory,
  requestRefund,
  addRating,
  getRatings,
};
