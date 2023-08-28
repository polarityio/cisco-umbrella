const { checkForStatusErrors, getGlobalDestinationListId } = require('./requestUtils');

let organizationInfo;

const removeDomainFromBlocklist = async (
  { isInBlocklist },
  token,
  options,
  requestWithDefaults,
  callback,
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

    let statusCode, body;
    try {
      const result = await requestWithDefaults({
        method: 'DELETE',
        url: `${options.umbrellaUrl}/policies/v2/destinationlists/${organizationInfo.globalBlockListId}/destinations/remove`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.access_token}`
        },
        body: JSON.stringify([isInBlocklist.id])
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

    callback(null, { message: 'Successfully Removed from Blocklist' });
  } catch (e) {
    Logger.error(e, 'Blocklist removal error');
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

module.exports = removeDomainFromBlocklist;
