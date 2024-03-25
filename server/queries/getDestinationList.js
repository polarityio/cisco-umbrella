const { get } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');
const getGlobalDestinationListId = require('./getGlobalDestinationListId');

const getDestinationList = async (destinationListName, options) => {
  const Logger = getLogger();

  try {
    const globalAllowListId = await getGlobalDestinationListId(
      destinationListName,
      options
    );

    const destinationList = get(
      'body.data',
      await requestWithDefaults({
        route: `policies/v2/destinationlists/${globalAllowListId}/destinations`,
        options
      })
    );

    Logger.trace(
      {
        destinationListName,
        globalAllowListId,
        destinationListResponse: destinationList
      },
      'Destination List Response'
    );

    return destinationList;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Destination List Failed'
    );
    throw error;
  }
};

module.exports = getDestinationList;
