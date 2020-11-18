var config = require('../config');
var crypto = require('crypto');
var querystring = require('querystring');
var _data = require('./data');
var https = require('https');

var helpers = {};

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = function (str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

helpers.emailTest = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

helpers.hash = function (str) {
  if (typeof str === 'string' && str.length > 0) {
    var hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(str)
      .digest('hex');
    return hash;
  } else {
  }
};

helpers.createRandomString = function (strLength) {
  strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false;

  if (strLength) {
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz123456789';
    var str = '';
    for (let i = 0; i < strLength; i++) {
      var randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      str += randomCharacter;
    }
    return str;
  } else {
    return false;
  }
};

// Verify if a given token id is currently valid for a given user
helpers.verifyToken = function (id, email, callback) {
  // Lookup the token
  _data.read('tokens', id, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

helpers.createStripeToken = function (callback) {
  var payload = {
    'card[number]': 4242424242424242,
    'card[exp_month]': 11,
    'card[exp_year]': 2021,
    'card[cvc]': 314,
  };

  var stringPayload = querystring.stringify(payload);

  // Configure the request details
  var requestDetails = {
    protocol: 'https:',
    hostname: 'api.stripe.com',
    method: 'POST',
    path: '/v1/tokens',
    auth: config.stripeApiKey,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringPayload),
    },
  };

  // Instantiate the request object
  var req = https.request(requestDetails, function (res) {
    // Grab the status of the sent request
    var status = res.statusCode;

    // get the data returned from the request
    res.on('data', (chunk) => {
      var stripeResData = JSON.parse(chunk);
      if (status == 200) {
        callback(false, stripeResData.id);
      }
    });
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', function (e) {
    callback(true, null);
  });
  // Add the payload
  req.write(stringPayload);
  // End the request
  req.end();
};

helpers.sendStripeCharge = function (amount, description, callback) {
  // Validate parameters
  amount = typeof amount == 'string' && isNaN(amount) ? false : +amount;
  description =
    typeof description == 'string' && description.trim().length > 0
      ? description.trim()
      : false;
  if (amount && description) {
    helpers.createStripeToken(function (err, tokenData) {
      // Configure the request payload
      if (!err && tokenData) {
        var payload = {
          amount,
          description,
          currency: 'usd',
          source: tokenData,
        };
        var stringPayload = querystring.stringify(payload);
        // Configure the request details
        var requestDetails = {
          protocol: 'https:',
          hostname: 'api.stripe.com',
          method: 'POST',
          path: '/v1/charges',
          auth: config.stripeApiKey,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload),
          },
        };

        // Instantiate the request object
        var req = https.request(requestDetails, function (res) {
          // Grab the status of the sent request
          var status = res.statusCode;

          res.on('data', (chunk) => {
            // console.log(`BODY: ${chunk}`);
            var stripeRes = JSON.parse(chunk);
            var orderData = {
              order_id: stripeRes.id,
              amount: stripeRes.amount,
              receipt_url: stripeRes.receipt_url,
              status: stripeRes.status,
            };
            if (status == 200) {
              callback(false, orderData);
            }
          });
        });

        // Bind to the error event so it doesn't get thrown
        req.on('error', function (e) {
          callback(true, null);
        });
        // Add the payload
        req.write(stringPayload);
        // End the request
        req.end();
      } else {
        callback(500, { Error: 'Error ordering item' });
      }
    });
  }
};

helpers.sendMail = function (name, email, callback) {
  var payload = {
    from:
      'Mailgun Sandbox <postmaster@sandbox056c6de5d6f3449a9d015a5bdb491379.mailgun.org>',
    to: `${name} <${email}>`,
    subject: 'Order Created Success',
    text:
      'The items you purchased was successful. Looking forward to seeing you next time',
  };

  var stringPayload = querystring.stringify(payload);

  // Configure the request details
  var requestDetails = {
    protocol: 'https:',
    hostname: 'api.mailgun.net',
    method: 'POST',
    path: '/v3/sandbox056c6de5d6f3449a9d015a5bdb491379.mailgun.org/messages',
    auth: config.mailGunApiKey,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringPayload),
    },
  };

  // Instantiate the request object
  var req = https.request(requestDetails, function (res) {
    // Grab the status of the sent request
    var status = res.statusCode;

    console.log(status);

    if (status == 200) {
      callback(false);
    } else {
      callback(true);
    }
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', function (e) {
    callback(e, null);
  });
  // Add the payload
  req.write(stringPayload);
  // End the request
  req.end();
};

module.exports = helpers;
