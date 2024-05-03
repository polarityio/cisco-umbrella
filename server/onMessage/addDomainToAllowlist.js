const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson },
  helpers: { sleep }
} = require('polarity-integration-utils');
const { getResultForThisEntity } = require('../dataTransformations');

const { requestWithDefaults } = require('../request');
const { getGlobalDestinationListId, getAllowListDestinations } = require('../queries');

const addDomainToAllowlist = async ({ domain, comment }, options, callback) => {
  const Logger = getLogger();

  try {
    const globalAllowListId = await getGlobalDestinationListId(
      options.allowlistDestinationName,
      options
    );

    const addToAllowListResponse = await requestWithDefaults({
      method: 'POST',
      route: `policies/v2/destinationlists/${globalAllowListId}/destinations`,
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

    Logger.trace(addToAllowListResponse, 'Result from add allowlist');

    await sleep(2000);

    const newAllowListDestinations = await getAllowListDestinations(
      [{ value: domain }],
      options
    );
    const newIsInAllowlist = getResultForThisEntity(
      { value: domain },
      newAllowListDestinations
    );

    callback(null, {
      message: 'Successfully Added To Allowlist',
      isInAllowlist: newIsInAllowlist
    });
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        detail: 'Failed Allowlist Submission',
        formattedError: err
      },
      'Allowlist Submission Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Allowlist Submission Failed'
        }
      ]
    });
  }
};

module.exports = addDomainToAllowlist;
