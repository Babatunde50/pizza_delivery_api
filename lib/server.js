/*
 * Primary file for the API
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const helpers = require('./helpers');
const config = require('../config');
const path = require('path');
var util = require('util');
var debug = util.debuglog('server');
var handlers = require('./handlers');

var server = {};

// HTTPS server options
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

// Instantiating the HTTP Server
server.httpServer = http.createServer(function (req, res) {
  server.unifiedServer(req, res);
});

// Instantiate the HTTPS server
server.httpsServer = https.createServer(server.httpsServerOptions, function (
  req,
  res
) {
  server.unifiedServer(req, res);
});

// All the server logic for both the http and https server
server.unifiedServer = function (req, res) {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  console.log(parsedUrl, 'from unifiedServer');

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';

  req.on('data', function (data) {
    buffer += decoder.write(data);
  });

  req.on('error', function (err) {
    // This prints the error message and stack trace to `stderr`.
    console.error(err.stack);
  });

  req.on('end', function () {
    buffer += decoder.end();

    // Choose the handler this request should go to., if one is not found then use the notFound handler
    var chosenHandler =
      typeof server.router[trimmedPath] != 'undefined'
        ? server.router[trimmedPath]
        : handlers.notFound;

    var data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the router;
    chosenHandler(data, function (statusCode, payload) {
      // Use 200 as default status code
      statusCode = typeof statusCode == 'number' ? statusCode : 200;

      // use the default payload as an empty object
      payload = typeof payload == 'object' ? payload : {};

      // Convert the payload to as string
      var payloadString = JSON.stringify(payload);

      // Return the response
      // res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode, {
        'Content-Type': 'application/json',
      });
      res.end(payloadString);

      // If the response is 200, print green otherwise print red
      if (statusCode === 200 || statusCode === 201) {
        debug(
          '\x1b[32m%s\x1b[0m',
          method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode
        );
      } else {
        debug(
          '\x1b[31m%s\x1b[0m',
          method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode
        );
      }
    });
  });
};

// Define a request router
server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  items: handlers.items,
  cart: handlers.cart,
  orders: handlers.orders,
};

// INit script
server.init = function () {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, function () {
    // Send to console, in yellow
    console.log(
      '\x1b[33m%s\x1b[0m',
      `The server is listening on port ${config.httpPort} now.`
    );
  });

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, function () {
    // Send to console, in yellow
    console.log(
      '\x1b[33m%s\x1b[0m',
      `The server is listening on port ${config.httpsPort} now.`
    );
  });
};

module.exports = server;
