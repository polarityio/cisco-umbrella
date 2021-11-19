const { flow, get, find, eq, toLower } = require('lodash/fp');
const {
  checkForStatusErrors,
  getOrganizationId,
  getGlobalDestinationListId
} = require('./requestUtils');

let organizationInfo;
let apiKeysChanged;

const addDomainToBlocklist = async (
  { domain, comment },
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

    try {
      const result = await requestWithDefaults({
        method: 'POST',
        url: `${options.managementUrl}/v1/organizations/${organizationInfo.organizationId}/destinationlists/${organizationInfo.globalBlockListId}/destinations`,
        auth: {
          username: options.managementApiKey,
          password: options.managementSecretKey
        },
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            destination: domain,
            comment
          }
        ])
      });
      const statusCode = result.statusCode;
      const body = result.body;
      checkForStatusErrors(statusCode, body, Logger);

      const newIsInBlocklist = await getIsInBlocklist(
        domain,
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

const getIsInBlocklist = async (domain, options, requestWithDefaults, Logger) => {
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

  const newIsInBlocklist = flow(
    get('data'),
    find(
      flow(get('destination'), toLower, eq(toLower(domain)))
    )
  )(body);
  
  return newIsInBlocklist;
};
module.exports = addDomainToBlocklist;
