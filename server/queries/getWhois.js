const { map } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');

const getWhois = async (entities, options) => {
  const Logger = getLogger();

  try {
    const whoIsRequests = map(
      (entity) => ({
        resultId: entity.value,
        route: `investigate/v2/whois/${entity.value}`,
        options
      }),
      entities
    );

    const whoIs = await requestsInParallel(whoIsRequests, 'body');

    return whoIs;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Category Labels By Ids Failed'
    );
    throw error;
  }
};

module.exports = getWhois;
