const { get, map, find, flow, toLower, eq } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const getDestinationList = require('./getDestinationList');

const getAllowListDestinations = async (entities, options) => {
  const Logger = getLogger();

  try {
    const allowList = await getDestinationList(options.allowlistDestinationName, options);

    const allowListDestinations = map((entity) => {
      const allowListDestination = find(
        flow(get('destination'), toLower, eq(flow(get('value'), toLower)(entity))),
        allowList
      );

      return {
        resultId: entity.value,
        result: allowListDestination
      };
    }, entities);


    Logger.trace(
      {
        allowList,
        allowListDestinations
      },
      'Getting Allowlist Destinations'
    );

    return allowListDestinations;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Allow List Destinations Failed'
    );
    throw error;
  }
};

module.exports = getAllowListDestinations;
