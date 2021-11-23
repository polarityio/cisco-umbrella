const { checkForStatusErrors } = require('./requestUtils');

const { map, get, flow, toLower, eq, find } = require('lodash/fp');


const addWhoIsDataToLookupResults = async (
  lookupResults,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const whoIsResults = await Promise.all(
      map(async ({ entity }) => {
        const result = await requestWithDefaults({
          url: `${options.investigateUrl}/whois/${entity.value}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${options.apiKey}`
          },
          json: true
        });
        const statusCode = result.statusCode;
        const body = result.body;
        checkForStatusErrors(statusCode, body, Logger);

        return body;
      }, lookupResults)
    );

    const updatedLookupResults = map((lookupResult) => {
      const details = get('data.details', lookupResult);
      if (details) {
        const whoIsData = find(
          flow(
            get('domainName'),
            toLower,
            eq(flow(get('entity.value'), toLower)(lookupResult))
          ),
          whoIsResults
        );
        lookupResult.data.details = {
          ...details,
          whoIsData
        };
        if (!!whoIsData) {
          lookupResult.data.summary = lookupResult.data.summary.concat(
            'Found WHOIS'
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

module.exports = addWhoIsDataToLookupResults;
