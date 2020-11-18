// var helpers = require('../helpers');
var _data = require('../data');
var items = {};

var fileName = 'menu-items';

// Items - get
items.get = function (data, callback) {
  // Check for token
  var tokenId =
    typeof data.headers.token === 'string' &&
    data.headers.token.trim().length >= 20
      ? data.headers.token.trim()
      : false;
  var count =
    typeof data.queryStringObject.count === 'string' &&
    isNaN(data.queryStringObject.count)
      ? false
      : +data.queryStringObject.count;
  var skip =
    typeof data.queryStringObject.skip === 'string' &&
    isNaN(data.queryStringObject.skip)
      ? false
      : +data.queryStringObject.skip;

  if (tokenId) {
    _data.read('tokens', tokenId, function (err, data) {
      if (!err && data) {
        _data.read('menu', fileName, function (err, data) {
          if (!err) {
            if (count) {
              data = data.slice(0, count);
            }
            if (skip) {
              data = data.slice(skip);
            }
            callback(200, data);
          } else {
            callback(500, { Error: 'Error reading menu items.' });
          }
        });
      } else {
        callback(400, { Error: 'Invalid token' });
      }
    });
  } else {
    callback(400, { Error: 'token not provided' });
  }
};

module.exports = items;
