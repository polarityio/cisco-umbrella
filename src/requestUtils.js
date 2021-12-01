const fp = require('lodash/fp');

const checkForStatusErrors = (statusCode, body, Logger) => {
  let possibleError = new Error();

  if (statusCode === 401) {
    possibleError.message =
      'InvalidCredentials: API or Secret Key. Ensure your keys were created with the correct options selected.';
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
  try {
    const result = await requestWithDefaults({
      url: `${options.managementUrl}/v1/organizations`,
      auth: {
        username: options.networkDevicesApiKey,
        password: options.networkDevicesSecretKey
      },
      json: true
    });
    const statusCode = result.statusCode;
    const body = result.body;
    checkForStatusErrors(statusCode, body, Logger);

    return fp.get('0.organizationId', body);
  } catch (requestError) {
    Logger.error(requestError, 'Request Error');
    let httpError = new Error();
    httpError.message = requestError.message;
    httpError.context = requestError;
    throw httpError;
  }
};

const getGlobalDestinationListId = async (
  listName,
  organizationId,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const result = await requestWithDefaults({
      url: `${options.managementUrl}/v1/organizations/${organizationId}/destinationlists`,
      auth: {
        username: options.managementApiKey,
        password: options.managementSecretKey
      },
      json: true
    });
    const statusCode = result.statusCode;
    const body = result.body;
    checkForStatusErrors(statusCode, body, Logger);

    const globalDestinationListId = fp.flow(
      fp.get('data'),
      fp.find(fp.flow(fp.get('name'), fp.equals(listName))),
      fp.get('id')
    )(body);

    return globalDestinationListId;
  } catch (requestError) {
    Logger.error(requestError, 'Request Error');
    let httpError = new Error();
    httpError.message = requestError.message;
    httpError.context = requestError;
    throw httpError;
  }
};

module.exports = {
  checkForStatusErrors,
  getOrganizationId,
  getGlobalDestinationListId
};
