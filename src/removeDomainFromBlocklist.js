const {
  checkForStatusErrors,
  getOrganizationId,
  getGlobalDestinationListId
} = require('./requestUtils');

let organizationInfo;
let apiKeysChanged;

const removeDomainFromBlocklist = async (
  { isInBlocklist },
  options,
  requestWithDefaults,
  callback,
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

    let statusCode, body;
    try {
      const result = await requestWithDefaults({
        method: 'DELETE',
        url: `${options.managementUrl}/v1/organizations/${organizationInfo.organizationId}/destinationlists/${organizationInfo.globalBlockListId}/destinations/remove`,
        auth: {
          username: options.managementApiKey,
          password: options.managementSecretKey
        },
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
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