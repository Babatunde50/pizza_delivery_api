// var helpers = require('../helpers');
var _data = require('../data');
const helpers = require('../helpers');
var cart = {};

var emailTest = helpers.emailTest;
var itemFileName = 'menu-items';

cart.post = function (data, callback) {
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

  if (tokenId && email && itemId) {
    helpers.verifyToken(tokenId, email, function (isValid) {
      if (isValid) {
        _data.read('menu', itemFileName, function (err, items) {
          if (!err && items) {
            var item = items.find(function (item) {
              return item.id === itemId;
            });
            if (item) {
              _data.read('users', email, function (err, userData) {
                if (!err && userData) {
                  // console.log(userData, item);
                  var index = userData.cart.findIndex(function (item) {
                    return item.id === itemId;
                  });
                  if (index > -1) {
                    var foundItem = userData.cart[index];
                    userData.cart[index] = {
                      ...foundItem,
                      quantity: foundItem.quantity + 1,
                    };
                    console.log(userData.cart);
                  } else {
                    userData.cart.push({ ...item, quantity: 1 });
                  }
                  _data.update('users', email, userData, function (err) {
                    if (!err) {
                      callback(200, {
                        Success: 'Item added to card successfully',
                      });
                    } else {
                      callback(500, { Error: 'Error adding item to cart' });
                    }
                  });
                } else {
                  callback(500, { Error: 'Error reading data' });
                }
              });
            } else {
              callback(404, { Error: 'Cannot find item' });
            }
          } else {
            callback(500, { Error: 'Error reading data' });
          }
        });
      } else {
        callback(400, { Error: 'Invalid token' });
      }
    });
  } else {
    callback(400, { Error: 'token or email not provided' });
  }
};

//get cart
cart.get = function (data, callback) {
  var email =
    typeof data.queryStringObject.email === 'string' &&
    data.queryStringObject.email.trim().length > 0
      ? data.queryStringObject.email
      : false;
  var tokenId =
    typeof data.headers.token === 'string' &&
    data.headers.token.trim().length >= 20
      ? data.headers.token.trim()
      : false;

  if (email && tokenId) {
    helpers.verifyToken(tokenId, email, function (success) {
      if (success) {
        _data.read('users', email, function (err, data) {
          if (!err && data) {
            callback(200, data.cart);
          } else {
            callback(500, { Error: 'Reading data failed' });
          }
        });
      } else {
        callback(400, { Error: 'Invalid credentials' });
      }
    });
  } else {
    callback(400, { Error: 'user email or token id not provided' });
  }
};

//delete cart
cart.delete = function (data, callback) {
  var email =
    typeof data.queryStringObject.email === 'string' &&
    data.queryStringObject.email.trim().length > 0
      ? data.queryStringObject.email
      : false;
  var tokenId =
    typeof data.headers.token === 'string' &&
    data.headers.token.trim().length >= 20
      ? data.headers.token.trim()
      : false;

  if (email && tokenId) {
    helpers.verifyToken(tokenId, email, function (success) {
      if (success) {
        _data.read('users', email, function (err, data) {
          if (!err && data) {
            data.cart = [];
            _data.update('users', email, data, function (err) {
              if (!err) {
                callback(200, { Success: 'Cart cleared.' });
              } else {
                callback(500, { Error: 'An error occurred' });
              }
            });
          } else {
            callback(500, { Error: 'Reading data failed' });
          }
        });
      } else {
        callback(400, { Error: 'Invalid credentials' });
      }
    });
  } else {
    callback(400, { Error: 'user email or token id not provided' });
  }
};

module.exports = cart;
