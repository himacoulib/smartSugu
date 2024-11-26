const allRoles = {
  admin: [
    // Gestion des utilisateurs
    'getUsers',
    'manageUsers',
    'manageClients',
    'manageCouriers',
    'viewUserDetails',

    // Gestion des commandes
    'manageOrders',
    'viewOrderDetails',
    'updateOrderStatus',
    'cancelOrder',
    'assignOrderToLivreur',

    // Gestion des livraisons
    'manageDeliveries',

    // Gestion des produits
    'manageProducts',
    'manageStores',

    // Gestion des promotions et paiements
    'managePromotions',
    'managePayments',
    'approveRatings',
    'manageDiscounts',

    // Gestion du panier
    'viewCart',
    'addToCart',
    'updateCartItem',
    'removeFromCart',
    'clearCart',

    // Rapports et analyses
    'viewReports',
    'viewAnalytics',

    // Paramètres globaux
    'manageSettings',

    // Gestion des administrateurs
    'createAdmin',
    'updateAdminPermissions',
    'deleteAdmin',
    'viewAdmins',
    'viewAdminLogs',

    // Gestion des notifications
    'createNotification',
    'viewAllNotifications',
    'deleteAllNotifications',
  ],
  client: [
    // Commandes
    'placeOrder',
    'trackOrder',
    'cancelOrder',
    'requestRefund',
    'viewOrderHistory',
    'viewOrderDetails',
    'generateOrderReceipt',
    'calculateOrderTotal',

    // Gestion du panier
    'viewCart',
    'addToCart',
    'updateCartItem',
    'removeFromCart',
    'clearCart',

    // Paiements et historique
    'viewPaymentHistory',
    'viewDeliveryHistory',

    // Notifications et évaluations
    'viewNotifications',
    'rateDelivery',
    'viewRatings',

    // Profil
    'editProfile',
    'contactSupport',
  ],
  livreur: [
    // Livraisons
    'pickUpOrder',
    'confirmPickup',
    'deliverOrder',
    'confirmDelivery',
    'updateDeliveryStatus',
    'trackDelivery',
    'viewOrderDetails',
    'assignOrder',

    // Historique et gains
    'viewDeliveryHistory',
    'viewPaymentHistory',
    'viewEarnings',

    // Notifications et évaluations
    'rateCustomer',
    'rateClient',
    'viewRatings',

    // Profil
    'editProfile',
    'contactSupport',

    'viewNotifications',
    'markNotificationsAsRead',
    'deleteNotifications',
  ],
  merchant: [
    // Produits et inventaire
    'addProduct',
    'updateProduct',
    'removeProduct',
    'updateProductStock',
    'setProductVisibility',

    // Commandes
    'viewOrderDetails',
    'processOrder',
    'viewOrderHistory',
    'updateOrderStatus',
    'managePendingOrders',

    // Promotions et retours
    'createPromotion',
    'viewPromotionPerformance',
    'manageReturns',

    // Rapports et analyses
    'viewSalesAnalytics',
    'viewCustomerFeedback',
    'trackRevenue',

    // Notifications et disponibilité
    'receiveOrderAlerts',
    'receiveStockAlerts',
    'setDeliveryAvailability',
    'trackDeliveryStatus',

    // Gestion des plaintes
    'resolveComplaints',

    'viewNotifications',
    'markNotificationsAsRead',
    'deleteNotifications',
  ],
  support: [
    // Support client et gestion
    'viewUserDetails',
    'viewOrderHistory',
    'manageComplaints',
    'viewTickets',
    'respondToClients',
    'resolveIssues',
    'viewSupportStatistics',

    'viewNotifications',
    'markNotificationsAsRead',
    'deleteNotifications',
  ],
};

// Définir les rôles disponibles
const roles = Object.keys(allRoles);

// Associer les permissions aux rôles
const roleRights = new Map(Object.entries(allRoles));

// Exporter les rôles et leurs droits
module.exports = {
  roles,
  roleRights,
};
