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

const getOrganizationId = async (token, options, requestWithDefaults, Logger) => {
  Logger.trace({ token }, 'token');
  try {
    const result = await requestWithDefaults({
      method: 'GET',
      url: `${options.umbrellaUrl}/admin/v2/organizations`,
      headers: {
        Authorization: `Bearer ${token.access_token}`
      },
      json: true
    });
    Logger.trace({ result }, 'result_ids');
    const statusCode = result.statusCode;
    const body = result.body;
    checkForStatusErrors(statusCode, body, Logger);

    return fp.get('0.organizationId', body);
  } catch (requestError) {
    Logger.trace({ requestError }, 'Request Error');
    Logger.error(requestError, 'Request Error');
    let httpError = new Error();
    httpError.message = requestError.message;
    httpError.context = requestError;
    throw httpError;
  }
};

const getGlobalDestinationListId = async (
  token,
  listName,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const requestOptions = {
      method: 'GET',
      url: `${options.umbrellaUrl}/policies/v2/destinationlists`,
      headers: {
        Authorization: `Bearer ${token.access_token}`
      },
      json: true
    };

    Logger.trace({ requestOptions }, 'requestOptions');
    const result = await requestWithDefaults(requestOptions);

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
