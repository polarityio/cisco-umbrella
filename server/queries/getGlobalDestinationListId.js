const { flow, get, find, eq } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');

const NodeCache = require('node-cache');
const destinationListsCache = new NodeCache({ stdTTL: 6 * 60 * 60 });

const getGlobalDestinationListId = async (globalDestinationListName, options) => {
  const Logger = getLogger();

  try {
    const destinationListsCacheKey = options.apiKey + options.secretKey;
    let destinationLists = destinationListsCache.get(destinationListsCacheKey);

    if (!destinationLists) {
      destinationLists = get(
        'body.data',
        await requestWithDefaults({
          route: 'policies/v2/destinationlists',
          options
        })
      );
      destinationListsCache.set(destinationListsCacheKey, destinationLists);
    }

    const globalDestinationListId = flow(
      find(flow(get('name'), eq(globalDestinationListName))),
      get('id')
    )(destinationLists);

    Logger.trace(
      { globalDestinationListName, destinationLists, globalDestinationListId },
      'Getting Global Destination List Id Result'
    );

    return globalDestinationListId;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Global Destination List Id Failed'
    );
    throw error;
  }
};

module.exports = getGlobalDestinationListId;
