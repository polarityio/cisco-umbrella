const { checkForStatusErrors, getGlobalDestinationListId } = require('./requestUtils');
const { map, get, flow, toLower, eq, find } = require('lodash/fp');

let organizationInfo;

const addAllowlistDataToLookupResults = async (
  token,
  lookupResults,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const globalAllowListId = await getGlobalDestinationListId(
      token,
      'Global Allow List',
      options,
      requestWithDefaults,
      Logger
    );

    organizationInfo = {
      globalAllowListId
    };

    const result = await requestWithDefaults({
      url: `https://api.umbrella.com/policies/v2/destinationlists/${organizationInfo.globalAllowListId}/destinations`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.access_token}`
      },
      json: true
    });
    const statusCode = result.statusCode;
    const body = result.body;
    checkForStatusErrors(statusCode, body, Logger);

    const updatedLookupResults = map((lookupResult) => {
      const details = get('data.details', lookupResult);
      if (details) {
        const isInAllowlist = flow(
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
          isInAllowlist
        };
        if (!!isInAllowlist) {
          lookupResult.data.summary = lookupResult.data.summary.concat(
            'Found in Global Allowlist'
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

module.exports = addAllowlistDataToLookupResults;
