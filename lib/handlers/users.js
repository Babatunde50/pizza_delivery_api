var _data = require('../data');
const helpers = require('../helpers');

var users = {};

var emailTest = helpers.emailTest;

users.post = function (data, callback) {
  // Check that all required fields are filled out
  var name =
    typeof data.payload.name == 'string' && data.payload.name.trim().length > 0
      ? data.payload.name.trim()
      : false;
  var email =
    typeof data.payload.email == 'string' &&
    emailTest.test(String(data.payload.email).toLowerCase())
      ? data.payload.email.trim()
      : false;
  var street =
    typeof data.payload.street == 'string' &&
    data.payload.street.trim().length > 0
      ? data.payload.street.trim()
      : false;
  var password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 6
      ? data.payload.password.trim()
      : false;

  if (name && email && street && password) {
    var userData = {
      name,
      email,
      street,
      password: helpers.hash(password),
      cart: [],
      orders: [],
    };
    _data.read('users', email, function (err) {
      if (err) {
        _data.create('users', email, userData, function (err) {
          if (!err) {
            callback(201, { Success: 'User has been created' });
          } else {
            console.log(err);
            callback(500, { Error: 'Error creating user' });
          }
        });
      } else {
        callback(400, { Error: 'A user with that email already exists.' });
      }
    });
  } else {
    callback(400, { Error: 'Invalid or Missing fields.' });
  }
};

// Users - get
// Required data:
//   QueryString - email
//   header - token
// Optional data: none
users.get = function (data, callback) {
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
            delete data.password;
            delete data.cart;
            callback(200, data);
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

// Users - put
// Required data:
//  QueryString - email
// Optional data: payload - name, street
users.put = function (data, callback) {
  var query =
    typeof data.queryStringObject.email === 'string' &&
    data.queryStringObject.email.trim().length > 0
      ? data.queryStringObject.email
      : false;
  var name =
    typeof data.payload.name == 'string' && data.payload.name.trim().length > 0
      ? data.payload.name.trim()
      : false;
  var street =
    typeof data.payload.street == 'string' &&
    data.payload.street.trim().length > 0
      ? data.payload.street.trim()
      : false;
  var tokenId =
    typeof data.headers.token === 'string' &&
    data.headers.token.trim().length >= 20
      ? data.headers.token.trim()
      : false;

  if (query && tokenId) {
    helpers.verifyToken(tokenId, query, function (isValid) {
      if (isValid) {
        _data.read('users', query, function (err, data) {
          if (!err && data) {
            if (name) {
              data.name = name;
            }
            if (street) {
              data.street = street;
            }
            _data.update('users', query, data, function (err) {
              if (!err) {
                callback(200, { Success: 'User has been updated' });
              } else {
                callback(500, { Error: 'Error updating user' });
              }
            });
          } else {
            callback(500, { Error: 'Error reading file' });
          }
        });
      } else {
        callback(400, { Error: 'Invalid token' });
      }
    });
  } else {
    callback(400, { Error: 'name of user or token not provided' });
  }
};

// Users - delete
// Required data:
//  QueryString - email
users.delete = function (data, callback) {
  var query =
    typeof data.queryStringObject.email === 'string' &&
    data.queryStringObject.email.trim().length > 0
      ? data.queryStringObject.email
      : false;
  var tokenId =
    typeof data.headers.token === 'string' &&
    data.headers.token.trim().length >= 20
      ? data.headers.token.trim()
      : false;

  if (query && tokenId) {
    helpers.verifyToken(tokenId, query, function (isValid) {
      if (isValid) {
        _data.delete('users', query, function (err) {
          if (!err) {
            _data.delete('tokens', tokenId, function (err) {
              if (!err) {
                callback(200, { Success: 'user has been deleted' });
              } else {
                callback(500, { Error: 'failed to delete user.' });
              }
            });
          } else {
            callback(500, { Error: 'Error deleting user' });
          }
        });
      } else {
        callback(400, { Error: 'Invalid token' });
      }
    });
  } else {
    callback(400, {
      Error: 'email of user to be delete or token not provided',
    });
  }
};
module.exports = users;
