const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson },
  helpers: { sleep }
} = require('polarity-integration-utils');
const { getResultForThisEntity } = require('../dataTransformations');

const { requestWithDefaults } = require('../request');
const { getGlobalDestinationListId, getBlockListDestinations } = require('../queries');
const addDomainToBlocklist = async ({ domain, comment }, options, callback) => {
  const Logger = getLogger();

  try {
    const globalBlockListId = await getGlobalDestinationListId(
      options.blocklistDestinationName,
      options
    );

    const addToBlockListResponse = await requestWithDefaults({
      method: 'POST',
      route: `policies/v2/destinationlists/${globalBlockListId}/destinations`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: [
        {
          destination: domain,
          comment: comment
        }
      ],
      options
    });

    Logger.trace(addToBlockListResponse, 'Result from add Blocklist');

    await sleep(2000);

    const newBlockListDestinations = await getBlockListDestinations(
      [{ value: domain }],
      options
    );
    const newIsInBlocklist = getResultForThisEntity(
      { value: domain },
      newBlockListDestinations
    );

    callback(null, {
      message: 'Successfully Added To Blocklist',
      isInBlocklist: newIsInBlocklist
    });
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        detail: 'Failed Blocklist Submission',
        formattedError: err
      },
      'Blocklist Submission Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Blocklist Submission Failed'
        }
      ]
    });
  }
};

module.exports = addDomainToBlocklist;
