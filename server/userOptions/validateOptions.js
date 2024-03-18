const { validateStringOptions } = require('./utils');

const validateOptions = async (options, callback) => {
  const stringOptionsErrorMessages = {
    apiKey: 'You must provide a valid API Key from your Cisco Umbrella Account',
    secretKey: 'You must provide a valid Secret Key from your Cisco Umbrella Account'
  };

  const stringValidationErrors = validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  callback(null, stringValidationErrors);
};

module.exports = validateOptions;
