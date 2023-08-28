const fp = require('lodash/fp');
const reduce = require('lodash/fp/reduce').convert({ cap: false });

const validateOptions = (options, callback) => {
  const stringOptionsErrorMessages = {
    investigateUrl: 'You must provide a valid Investigation URL',
    investigateApiKey:
      'You must provide a valid API Key from your Cisco Umbrella Account',
    apiKey: 'You must provide a valid API Key from your Cisco Umbrella Account',
    secretKey: 'You must provide a valid Secret Key from your Cisco Umbrella Account',
    ...((options.allowBlocklistSubmission.value ||
      options.allowAllowlistSubmission.value) && {
      umbrellaUrl: 'You must provide a valid Umbrella URL'
    })
  };

  const stringValidationErrors = _validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const investigateUrlValidationError = _validateUrlOption(options, 'investigateUrl');
  const managementUrlValidationError = _validateUrlOption(options, 'umbrellaUrl');

  callback(
    null,
    stringValidationErrors
      .concat(investigateUrlValidationError)
      .concat(managementUrlValidationError)
  );
};

const _validateStringOptions = (stringOptionsErrorMessages, options, otherErrors = []) =>
  reduce((agg, message, optionKey) => {
    const isString = typeof options[optionKey].value === 'string';
    const isEmptyString = isString && fp.isEmpty(options[optionKey].value);

    return !isString || isEmptyString
      ? agg.concat({
          key: optionKey,
          message
        })
      : agg;
  }, otherErrors)(stringOptionsErrorMessages);

const _validateUrlOption = (option, key) =>
  option[key].value && option[key].value.endsWith('//')
    ? [
        {
          key,
          message: 'Your Url must not end with a //'
        }
      ]
    : [];

module.exports = validateOptions;
