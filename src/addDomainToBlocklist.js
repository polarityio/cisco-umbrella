const { flow, get, find, eq, toLower } = require('lodash/fp');
const { checkForStatusErrors, getGlobalDestinationListId } = require('./requestUtils');

let organizationInfo;

const addDomainToBlocklist = async (
  payload,
  token,
  options,
  requestWithDefaults,
  callback,
  Logger
) => {
  try {
    //TODO: add check of blocklist to see if it's already in the global blocklist

    //TODO: change blocklist label

    //TODO: add option for and implementation of adding to allow list

    //TODO: try to get eventSummary and eventType on domains when doing the initial query
    //TODO: Add in who is data from Umbrella to the integration.

    //TODO: add remove from blocklist and allow list?
    options.managementSecretKey;

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

    try {
      const requestOptions = {
        method: 'POST',
        url: `${options.umbrellaUrl}/policies/v2/destinationlists/${organizationInfo.globalBlockListId}/destinations`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.access_token}`
        },
        body: JSON.stringify([
          {
            destination: payload.domain,
            comment: payload.comment
          }
        ])
      };
      Logger.trace(requestOptions, 'Request Options add');
      const result = await requestWithDefaults(requestOptions);
      Logger.trace(result, 'add result');
      const statusCode = result.statusCode;
      const body = result.body;
      checkForStatusErrors(statusCode, body, Logger);

      const newIsInBlocklist = await getIsInBlocklist(
        token,
        payload.domain,
        options,
        requestWithDefaults,
        Logger
      );

      callback(null, {
        message: 'Successfully Added To Blocklist',
        isInBlocklist: newIsInBlocklist
      });
    } catch (requestError) {
      Logger.error(requestError, 'Request Error');
      let httpError = new Error();
      httpError.message = requestError.message;
      httpError.context = requestError;
      throw httpError;
    }
  } catch (e) {
    Logger.error(e, 'Blocklist submission error');
    return callback({
      errors: [
        {
          err: e.context,
          detail: e.message
        }
      ]
    });
  }
};

const getIsInBlocklist = async (token, domain, options, requestWithDefaults, Logger) => {
  const result = await requestWithDefaults({
    url: `${options.umbrellaUrl}/policies/v2/destinationlists/${organizationInfo.globalBlockListId}/destinations`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.access_token}`
    },
    json: true
  });
  const statusCode = result.statusCode;
  const body = result.body;
  checkForStatusErrors(statusCode, body, Logger);

  const newIsInBlocklist = flow(
    get('data'),
    find(flow(get('destination'), toLower, eq(toLower(domain))))
  )(body);

  return newIsInBlocklist;
};
module.exports = addDomainToBlocklist;
