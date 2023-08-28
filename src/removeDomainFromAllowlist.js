const { checkForStatusErrors, getGlobalDestinationListId } = require('./requestUtils');

let organizationInfo;

const removeDomainFromAllowlist = async (
  { isInAllowlist },
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

    let statusCode, body;
    try {
      const result = await requestWithDefaults({
        method: 'DELETE',
        url: `${options.umbrellaUrl}/policies/v2/destinationlists/${organizationInfo.globalAllowListId}/destinations/remove`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.access_token}`
        },
        body: JSON.stringify([isInAllowlist.id])
      });
      statusCode = result.statusCode;
      body = result.body;
    } catch (requestError) {
      Logger.error(requestError, 'Request Error');
      let httpError = new Error();
      httpError.message = requestError.message;
      httpError.context = requestError;
      throw httpError;
    }

    checkForStatusErrors(statusCode, body, Logger);

    callback(null, { message: 'Successfully Removed from Allowlist' });
  } catch (e) {
    Logger.error(e, 'Allowlist removal error');
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

module.exports = removeDomainFromAllowlist;
