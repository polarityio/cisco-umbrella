const { isEmpty } = require('lodash/fp');
const reduce = require('lodash/fp/reduce').convert({ cap: false });

const validateStringOptions = (stringOptionsErrorMessages, options, otherErrors = []) =>
  reduce((agg, message, optionName) => {
    const isString = typeof options[optionName].value === 'string';
    const isEmptyString = isString && isEmpty(options[optionName].value);

    return !isString || isEmptyString
      ? agg.concat({
          key: optionName,
          message
        })
      : agg;
  }, otherErrors)(stringOptionsErrorMessages);

const flattenOptions = (options) =>
  reduce(
    (agg, optionObj, optionKey) => ({ ...agg, [optionKey]: get('value', optionObj) }),
    {},
    options
  );

module.exports = {
  validateStringOptions,
  flattenOptions
};
