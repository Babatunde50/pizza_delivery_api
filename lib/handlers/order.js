const { cart } = require('.');
var _data = require('../data');
var helpers = require('../helpers');
var orders = {};

var emailTest = helpers.emailTest;
var menuItemFileName = 'menu-items';

orders.post = function (data, callback) {
  var orderType =
    typeof data.queryStringObject.type === 'string' &&
    data.queryStringObject.type.trim().length > 0
      ? data.queryStringObject.type.trim().toLowerCase()
      : false;
  var tokenId =
    typeof data.headers.token === 'string' &&
    data.headers.token.trim().length >= 20
      ? data.headers.token.trim()
      : false;
  var email =
    typeof data.payload.email == 'string' &&
    emailTest.test(String(data.payload.email).toLowerCase())
      ? data.payload.email.trim()
      : false;
  var itemId =
    typeof data.payload.itemId == 'string' && data.payload.itemId.length > 0
      ? data.payload.itemId
      : false;

  if (orderType && tokenId && email) {
    helpers.verifyToken(tokenId, email, function (isValid) {
      if (isValid) {
        _data.read('users', email, function (err, userData) {
          if (!err && userData) {
            if (orderType == 'item' && itemId) {
              // do some crazy stuffs to order item
              _data.read('menu', menuItemFileName, function (err, menuData) {
                if (!err && menuData) {
                  var item = menuData.find(function (item) {
                    return item.id === itemId;
                  });
                  if (item) {
                    helpers.sendStripeCharge(
                      item.price,
                      'Order for a single item',
                      function (err, orderData) {
                        if (!err && orderData) {
                          userData.orders.push(orderData);
                          _data.update('users', email, userData, function (
                            err
                          ) {
                            if (!err) {
                              helpers.sendMail(
                                userData.name,
                                userData.email,
                                function (err) {
                                  callback(200, orderData);
                                }
                              );
                            } else {
                              callback(500, { Error: 'Error creating order' });
                            }
                          });
                        } else {
                          callback(500, { Error: 'Error creating order' });
                        }
                      }
                    );
                  } else {
                    callback(404, { Error: 'item not found' });
                  }
                } else {
                  callback(500, { Error: 'Error reading menu items' });
                }
              });
            } else if (orderType == 'cart') {
              if (userData.cart.length === 0) {
                return callback(404, { Error: 'Cart is empty' });
              }
              var totalPrice = userData.cart.reduce(function (prev, cur) {
                return prev + cur.quantity * cur.price;
              }, 0);
              helpers.sendStripeCharge(
                totalPrice,
                'Order for all cart items',
                function (err, orderData) {
                  if (!err && orderData) {
                    userData.orders.push(orderData);
                    userData.cart = [];
                    _data.update('users', email, userData, function (err) {
                      if (!err) {
                        helpers.sendMail(
                          userData.name,
                          userData.email,
                          function (err) {
                            callback(200, orderData);
                          }
                        );
                      } else {
                        callback(500, { Error: 'Error creating order' });
                      }
                    });
                  } else {
                    callback(500, { Error: 'Error creating order' });
                  }
                }
              );
            } else {
              callback(400, {
                Error: { Error: 'Missing required field itemId' },
              });
            }
          } else {
            callback(500, { Error: 'cannot find user' });
          }
        });
      } else {
        callback(400, { Error: 'Invalid token provided' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

module.exports = orders;
