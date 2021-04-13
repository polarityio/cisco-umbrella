const fp = require('lodash/fp');
const reduce = require('lodash/fp/reduce').convert({ cap: false });

const validateOptions = (options, callback) => {
  const stringOptionsErrorMessages = {
    investigateUrl: 'You must provide a valid Investigation URL',
    apiKey: 'You must provide a valid API Key from your Cisco Umbrella Account',
    ...(options.allowBlocklistSubmission.value && { enforcementUrl: 'You must provide a valid Enforcement URL' }),
    ...(options.allowBlocklistSubmission.value && {
      customerKey: 'You must provide a valid Customer Key from your Cisco Umbrella Account'
    }),
    ...(options.allowBlocklistSubmission.value && { eventTypes: 'You must provide at least one Event Type' }),
    ...(options.allowBlocklistSubmission.value && { enforcementUrl: 'You must provide at least one Event Severity' })
  };

  const stringValidationErrors = _validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const investigateUrlValidationError = _validateUrlOption(options, 'investigateUrl');
  const enforcementUrlValidationError = _validateUrlOption(options, 'enforcementUrl');

  callback(null, stringValidationErrors.concat(investigateUrlValidationError).concat(enforcementUrlValidationError));
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
    ? [{
        key,
        message: 'Your Url must not end with a //'
      }]
    : [];

module.exports = validateOptions;
