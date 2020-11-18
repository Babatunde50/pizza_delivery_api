var helpers = require('../helpers');
var _data = require('../data');
var tokens = {};

var emailTest = helpers.emailTest;

// Tokens - post
tokens.post = function (data, callback) {
  var email =
    typeof data.payload.email == 'string' &&
    emailTest.test(String(data.payload.email).toLowerCase())
      ? data.payload.email.trim()
      : false;
  var password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (email && password) {
    _data.read('users', email, function (err, userData) {
      if (!err && userData) {
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.password) {
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 3600 * 1000;
          var tokenObject = {
            email,
            id: tokenId,
            expires,
          };
          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: 'could not create a token' });
            }
          });
        } else {
          callback(400, { Error: 'Password do not match' });
        }
      } else {
        callback(400, { Error: 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Tokens - get
tokens.get = function (data, callback) {
  // Check that the phone number is valid
  var id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the user
    _data.read('tokens', id, function (err, data) {
      if (!err && data) {
        callback(200, data);
      } else {
        callback(404, { Error: 'Token not found' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Tokens - put
tokens.put = function (data, callback) {
  var id =
    typeof data.payload.id == 'string' && data.payload.id.trim().length >= 20
      ? data.payload.id.trim()
      : false;
  var extend =
    typeof data.payload.extend == 'boolean' && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    // Lookup token
    _data.read('tokens', id, function (err, tokenData) {
      console.log(tokenData, Date.now());
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 3600 * 1000;
          _data.update('tokens', id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not update the token.' });
            }
          });
        } else {
          callback(400, { Error: 'Token has expired and cannot be extended.' });
        }
      } else {
        callback(400, { Error: 'Specified token does not exists' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field or invalid field' });
  }
};

// Tokens - delete
tokens.delete = function (data, callback) {
  // Check that the id number is valid
  var id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length >= 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    _data.read('tokens', id, function (err, data) {
      if (!err && data) {
        _data.delete('tokens', id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the specified user.' });
          }
        });
      } else {
        callback(400, { Error: 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { Error: 'Missing field required' });
  }
};

module.exports = tokens;
