const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');
const { getGlobalDestinationListId } = require('../queries');

const removeDomainFromBlocklist = async ({ isInBlocklist }, options, callback) => {
  const Logger = getLogger();

  try {
    const globalBlockListId = await getGlobalDestinationListId(
      'Global Block List',
      options
    );

    const removeFromBlockListResponse = await requestWithDefaults({
      method: 'DELETE',
      route: `policies/v2/destinationlists/${globalBlockListId}/destinations/remove`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: [isInBlocklist.id],
      options
    });

    Logger.trace(removeFromBlockListResponse, 'Result from remove Blocklist');

    callback(null, { message: 'Successfully Removed from Blocklist' });
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        detail: 'Failed Blocklist Removal',
        formattedError: err
      },
      'Blocklist Removal Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Blocklist Removal Failed'
        }
      ]
    });
  }
};

module.exports = removeDomainFromBlocklist;
