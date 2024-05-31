const { getGlobalDestinationListId } = require('../queries');
const { validateStringOptions, flattenOptions } = require('./utils');

const validateOptions = async (options, callback) => {
  const stringOptionsErrorMessages = {
    apiKey: '* Required',
    secretKey: '* Required',
    blocklistDestinationName: '* Required',
    allowlistDestinationName: '* Required'
  };

  const stringValidationErrors = validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const noStatusesSelectedError =
    options.statuses.value.length === 0
      ? {
          key: 'statuses',
          message: '* At least one Return Status must be selected'
        }
      : [];

  const destinationNameErrors = !stringValidationErrors.length
    ? await getDestinationNameErrors(options)
    : [];

  const errors = []
    .concat(stringValidationErrors)
    .concat(noStatusesSelectedError)
    .concat(destinationNameErrors);

  callback(null, errors);
};

const getDestinationNameErrors = async (options) => {
  const flattenedOptions = flattenOptions(options);

  let blocklistDestinationNameError = [], allowlistDestinationNameError = [];

  const blockListDestinationId = await getGlobalDestinationListId(
    flattenedOptions.blocklistDestinationName,
    flattenedOptions
  )

  if (!blockListDestinationId) {
    blocklistDestinationNameError = [{
      key: 'blocklistDestinationName',
      message:
        '* Blocklist Destination Name not found. Please confirm the Name and spelling is in Umbrella under the Side Nav -> Policies -> Policy Components -> Destination Lists. If not, please create it and try again.'
    }];
  }

  const allowListDestinationId = await getGlobalDestinationListId(
    flattenedOptions.allowlistDestinationName,
    flattenedOptions
  )

  if (!allowListDestinationId) {
    allowlistDestinationNameError = [
      {
        key: 'allowlistDestinationName',
        message:
          '* Allowlist Destination Name not found. Please confirm the Name and spelling is in Umbrella under the Side Nav -> Policies -> Policy Components -> Destination Lists. If not, please create it and try again.'
      }
    ];
  }

  return blocklistDestinationNameError.concat(allowlistDestinationNameError);
};

module.exports = validateOptions;
