const { get, map, find, flow, toLower, eq } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const getDestinationList = require('./getDestinationList');

const getBlockListDestinations = async (entities, options) => {
  const Logger = getLogger();

  try {
    const blockList = await getDestinationList('Global Block List', options);
    
    const blockListDestinations = map((entity) => {
      const allowListDestination = find(
        flow(get('destination'), toLower, eq(flow(get('value'), toLower)(entity))),
        blockList
      );

      return {
        resultId: entity.value,
        result: allowListDestination
      };
    }, entities);

    Logger.trace(
      {
        blockList,
        blockListDestinations
      },
      'Getting Blocklist Destinations'
    );

    return blockListDestinations;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Blocklist Destinations Failed'
    );
    throw error;
  }
};

module.exports = getBlockListDestinations;
