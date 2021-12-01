const {
  checkForStatusErrors,
  getOrganizationId,
  getGlobalDestinationListId
} = require('./requestUtils');

const { map, get, flow, toLower, eq, find } = require('lodash/fp');

let organizationInfo;
let apiKeysChanged;

const addBlocklistDataToLookupResults = async (
  lookupResults,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const apiKeys =
      options.networkDevicesApiKey +
      options.networkDevicesSecretKey +
      options.managementApiKey +
      options.managementSecretKey;

    if (!organizationInfo || apiKeys !== apiKeysChanged) {
      const organizationId = await getOrganizationId(
        options,
        requestWithDefaults,
        Logger
      );
      const globalBlockListId = await getGlobalDestinationListId(
        'Global Block List',
        organizationId,
        options,
        requestWithDefaults,
        Logger
      );

      apiKeysChanged = apiKeys;
      organizationInfo = {
        organizationId,
        globalBlockListId
      };
    }

    const result = await requestWithDefaults({
      url: `${options.managementUrl}/v1/organizations/${organizationInfo.organizationId}/destinationlists/${organizationInfo.globalBlockListId}/destinations`,
      method: 'GET',
      auth: {
        username: options.managementApiKey,
        password: options.managementSecretKey
      },
      headers: { Accept: 'application/json' },
      json: true
    });
    const statusCode = result.statusCode;
    const body = result.body;
    checkForStatusErrors(statusCode, body, Logger);

    const updatedLookupResults = map((lookupResult) => {
      const details = get('data.details', lookupResult);
      if (details) {
        const isInBlocklist = flow(
          get('data'),
          find(
            flow(
              get('destination'),
              toLower,
              eq(flow(get('entity.value'), toLower)(lookupResult))
            )
          )
        )(body);
        lookupResult.data.details = {
          ...details,
          isInBlocklist
        };
        if (!!isInBlocklist) {
          lookupResult.data.summary = lookupResult.data.summary.concat(
            'Found in Global Blocklist'
          );
        }
      }
      return lookupResult;
    }, lookupResults);

    return updatedLookupResults;
  } catch (requestError) {
    Logger.error(requestError, 'Request Error');
    let httpError = new Error();
    httpError.message = requestError.message;
    httpError.context = requestError;
    throw httpError;
  }
};

module.exports = addBlocklistDataToLookupResults;
