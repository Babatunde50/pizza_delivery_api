var usersSubHandlers = require('./users');
var tokensSubHandlers = require('./tokens');
var itemsSubHandlers = require('./items');
var cartSubHandlers = require('./cart');
var orderSubHandlers = require('./order');

var handlers = {};

// Users
handlers.users = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Tokens
handlers.tokens = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Cart
handlers.cart = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._cart[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Orders
handlers.orders = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._orders[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for submethods
handlers._users = usersSubHandlers;
handlers._tokens = tokensSubHandlers;
handlers._cart = cartSubHandlers;
handlers._orders = orderSubHandlers;

// ping route
handlers.ping = function (data, callback) {
  callback(200);
};

// Items route
handlers.items = function (data, callback) {
  if (data.method.toLowerCase() === 'get') {
    itemsSubHandlers.get(data, callback);
  } else {
    callback(405);
  }
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

module.exports = handlers;
