/*
 * Creates and export configuration variables
 *
 */

// Container for all the environments

var environments = {};

environments.staging = {
  httpPort: 8080,
  httpsPort: 8081,
  envName: 'staging',
  hashingSecret: 'thisIsASecret',
  stripeApiKey: 'sk_test_TWhJmb43kpXu84zJCDeBFPEC',
  mailGunApiKey: 'api:f8c70dd97ef35409fa719ff660d91030-ba042922-e032c8a7',
};

environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'thisIsASecret',
  stripeApiKey: 'sk_test_TWhJmb43kpXu84zJCDeBFPEC',
  mailGunApiKey: 'api:f8c70dd97ef35409fa719ff660d91030-ba042922-e032c8a7',
};

// Determine which environmet was passed as a command-line argument
var currentEnvironment =
  typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

// Check that the current enviroment is one of the environmetn above, if not, default to staging.
var environmentToExport =
  typeof environments[currentEnvironment] === 'object'
    ? environments[currentEnvironment]
    : environments['staging'];

module.exports = environmentToExport;
