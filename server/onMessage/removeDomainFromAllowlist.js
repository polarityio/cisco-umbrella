const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');
const { getGlobalDestinationListId } = require('../queries');

const removeDomainFromAllowlist = async ({ isInAllowlist }, options, callback) => {
  const Logger = getLogger();

  try {
    const globalAllowListId = await getGlobalDestinationListId(
      'Global Allow List',
      options
    );

    const removeFromAllowListResponse = await requestWithDefaults({
      method: 'DELETE',
      route: `policies/v2/destinationlists/${globalAllowListId}/destinations/remove`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: [isInAllowlist.id],
      options
    });

    Logger.trace(removeFromAllowListResponse, 'Result from remove allowlist');

    callback(null, { message: 'Successfully Removed from Allowlist' });
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        detail: 'Failed Allowlist Removal',
        formattedError: err
      },
      'Allowlist Removal Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Allowlist Removal Failed'
        }
      ]
    });
  }
};

module.exports = removeDomainFromAllowlist;
