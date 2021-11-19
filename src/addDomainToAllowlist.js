const { flow, get, find, eq, toLower } = require('lodash/fp');
const {
  checkForStatusErrors,
  getOrganizationId,
  getGlobalDestinationListId
} = require('./requestUtils');

let organizationInfo;
let apiKeysChanged;

const addDomainToAllowlist = async (
  { domain, comment },
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
      const globalAllowListId = await getGlobalDestinationListId(
        "Global Allow List",
        organizationId,
        options,
        requestWithDefaults,
        Logger
      );

      apiKeysChanged = apiKeys;
      organizationInfo = {
        organizationId,
        globalAllowListId
      };
    }

    try {
      const result = await requestWithDefaults({
        method: 'POST',
        url: `${options.managementUrl}/v1/organizations/${organizationInfo.organizationId}/destinationlists/${organizationInfo.globalAllowListId}/destinations`,
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

      const newIsInAllowlist = await getIsInAllowlist(
        domain,
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

const getIsInAllowlist = async (domain, options, requestWithDefaults, Logger) => {
  const result = await requestWithDefaults({
    url: `${options.managementUrl}/v1/organizations/${organizationInfo.organizationId}/destinationlists/${organizationInfo.globalAllowListId}/destinations`,
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

  const newIsInAllowlist = flow(
    get('data'),
    find(
      flow(get('destination'), toLower, eq(toLower(domain)))
    )
  )(body);
  
  return newIsInAllowlist;
};
module.exports = addDomainToAllowlist;
