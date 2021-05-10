const moment = require('moment');
const { version } = require('../package.json');
const fp = require('lodash/fp');

let organizationInfo;

const addDomainToBlocklist = async ({ domain, comment }, options, requestWithDefaults, callback, Logger) => {
  try {
    if (!organizationInfo) {
      const organizationId = await getOrganizationId(options, requestWithDefaults, Logger);
      const globalBlockListId = await getGlobalBlockListId(organizationId, options, requestWithDefaults, Logger);
      organizationInfo = {
        organizationId,
        globalBlockListId
      };
    }

    let statusCode, body;
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

    callback(null, { message: 'Successfully Added To Blocklist' });
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

const checkForStatusErrors = (statusCode, body, Logger) => {
  let possibleError = new Error();

  if (statusCode === 401) {
    possibleError.message = 'InvalidCredentials: Invalid Customer Key';
    throw possibleError;
  }

  if (Math.round(statusCode * 0.01) / 0.01 !== 200) {
    Logger.trace({ statusCode, body }, 'Unexpected HTTP Status Code');
    possibleError.message = body.message || 'Unexpected HTTP Status Code';
    possibleError.context = { ...body, statusCode };
    throw possibleError;
  }
};

const getOrganizationId = async (options, requestWithDefaults, Logger) => {
  let statusCode, body, organizationId;
  try {
    const result = await requestWithDefaults({
      url: `${options.managementUrl}/v1/organizations`,
      auth: {
        username: options.networkDevicesApiKey,
        password: options.networkDevicesSecretKey
      },
      json: true
    });
    statusCode = result.statusCode;
    body = result.body;
    organizationId = fp.get('0.organizationId', body);
  } catch (requestError) {
    Logger.error(requestError, 'Request Error');
    let httpError = new Error();
    httpError.message = requestError.message;
    httpError.context = requestError;
    throw httpError;
  }

  checkForStatusErrors(statusCode, body, Logger);
  return organizationId;
};

const getGlobalBlockListId = async (organizationId, options, requestWithDefaults, Logger) => {
  let statusCode, body, globalBlockListId;
  try {
    const result = await requestWithDefaults({
      url: `${options.managementUrl}/v1/organizations/${organizationId}/destinationlists`,
      auth: {
        username: options.managementApiKey,
        password: options.managementSecretKey
      },
      json: true
    });
    statusCode = result.statusCode;
    body = result.body;
    globalBlockListId = fp.flow(
      fp.get('data'),
      fp.find(fp.flow(fp.get('name'), fp.equals('Global Block List'))),
      fp.get('id'),
    )(body);
  } catch (requestError) {
    Logger.error(requestError, 'Request Error');
    let httpError = new Error();
    httpError.message = requestError.message;
    httpError.context = requestError;
    throw httpError;
  }

  checkForStatusErrors(statusCode, body, Logger);
  return globalBlockListId;
};

module.exports = addDomainToBlocklist;
