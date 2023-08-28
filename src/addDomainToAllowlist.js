const { flow, get, find, eq, toLower } = require('lodash/fp');
const { checkForStatusErrors, getGlobalDestinationListId } = require('./requestUtils');

let organizationInfo;

const addDomainToAllowlist = async (
  payload,
  token,
  options,
  requestWithDefaults,
  callback,
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

    try {
      const requestOptions = {
        method: 'POST',
        url: `${options.umbrellaUrl}/policies/v2/destinationlists/${organizationInfo.globalAllowListId}/destinations`,
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
      Logger.trace(result, 'Result from add allowlist');
      const statusCode = result.statusCode;
      const body = result.body;
      checkForStatusErrors(statusCode, body, Logger);

      const newIsInAllowlist = await getIsInAllowlist(
        token,
        payload.domain,
        options,
        requestWithDefaults,
        Logger
      );

      callback(null, {
        message: 'Successfully Added To Allowlist',
        isInAllowlist: newIsInAllowlist
      });
    } catch (requestError) {
      Logger.error(requestError, 'Request Error');
      let httpError = new Error();
      httpError.message = requestError.message;
      httpError.context = requestError;
      throw httpError;
    }
  } catch (e) {
    Logger.error(e, 'Allowlist submission error');
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

const getIsInAllowlist = async (token, domain, options, requestWithDefaults, Logger) => {
  const result = await requestWithDefaults({
    method: 'GET',
    url: `${options.umbrellaUrl}/policies/v2/destinationlists/${organizationInfo.globalAllowListId}/destinations`,
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

  const newIsInAllowlist = flow(
    get('data'),
    find(flow(get('destination'), toLower, eq(toLower(domain))))
  )(body);

  return newIsInAllowlist;
};
module.exports = addDomainToAllowlist;
