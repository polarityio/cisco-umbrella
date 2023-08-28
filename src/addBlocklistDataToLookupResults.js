const { checkForStatusErrors, getGlobalDestinationListId } = require('./requestUtils');

const { map, get, flow, toLower, eq, find } = require('lodash/fp');

let organizationInfo;

const addBlocklistDataToLookupResults = async (
  token,
  lookupResults,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const globalBlockListId = await getGlobalDestinationListId(
      token,
      'Global Block List',
      options,
      requestWithDefaults,
      Logger
    );

    organizationInfo = {
      globalBlockListId
    };

    const requestOptions = {
      url: `${options.umbrellaUrl}/policies/v2/destinationlists/${organizationInfo.globalBlockListId}/destinations`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.access_token}`
      },
      json: true
    };

    Logger.trace({ requestOptions }, '__requestOptions__');

    const result = await requestWithDefaults(requestOptions);
    Logger.trace({ result }, 'result');

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

    Logger.trace({ updatedLookupResults }, 'updatedLookupResults');
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
