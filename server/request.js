const { map, get, getOr, filter, flow, negate, isEmpty } = require('lodash/fp');
const { parallelLimit } = require('async');

const {
  requests: { createRequestWithDefaults }
} = require('polarity-integration-utils');
const config = require('../config/config');

const NodeCache = require('node-cache');
const tokenCache = new NodeCache();

const requestForAuth = createRequestWithDefaults({
  config,
  roundedSuccessStatusCodes: [200],
  postprocessRequestFailure: (error) => {
    const errorResponseBody = JSON.parse(error.description);
    error.message = `${error.message} - (${error.status})${
      errorResponseBody.message || errorResponseBody.errorMessage
        ? `| ${errorResponseBody.message || errorResponseBody.errorMessage}`
        : ''
    }`;

    throw error;
  }
});

const requestWithDefaults = createRequestWithDefaults({
  config,
  roundedSuccessStatusCodes: [200],
  requestOptionsToOmitFromLogsKeyPaths: ['headers.Authorization'],
  preprocessRequestOptions: async ({ route, options, ...requestOptions }) => ({
    ...requestOptions,
    url: `https://api.umbrella.com/${route}`,
    headers: {
      ...requestOptions.headers,
      Authorization: `Bearer ${await getToken(options)}`
    },
    json: true
  }),
  postprocessRequestFailure: (error) => {
    if (error.status === 404 && JSON.parse(error.requestOptions).route.includes('whois')){
      return;
    }
    const errorResponseBody = JSON.parse(error.description);
    error.message = `${error.message} - (${error.status})${
      errorResponseBody.message || errorResponseBody.errorMessage
        ? `| ${errorResponseBody.message || errorResponseBody.errorMessage}`
        : ''
    }`;

    throw error;
  }
});

const getToken = async (options) => {
  const tokenCacheKey = options.apiKey + options.secretKey;
  const cachedToken = tokenCache.get(tokenCacheKey);
  if (cachedToken) return cachedToken;

  const tokenResponse = get(
    'body',
    await requestForAuth({
      url: 'https://api.umbrella.com/auth/v2/token',
      auth: {
        user: options.apiKey,
        pass: options.secretKey
      },
      json: true
    })
  );

  tokenCache.set(
    tokenCacheKey,
    tokenResponse.access_token,
    tokenResponse.expires_in - 120
  );

  return tokenResponse.access_token;
};

const createRequestsInParallel =
  (requestWithDefaults) =>
  async (
    requestsOptions,
    responseGetPath,
    limit = 10,
    onlyReturnPopulatedResults = true
  ) => {
    const unexecutedRequestFunctions = map(
      ({ resultId, ...requestOptions }) =>
        async () => {
          const response = await requestWithDefaults(requestOptions);
          const result = responseGetPath ? get(responseGetPath, response) : response;
          return resultId ? { resultId, result } : result;
        },
      requestsOptions
    );

    const results = await parallelLimit(unexecutedRequestFunctions, limit);

    return onlyReturnPopulatedResults
      ? filter(
          flow((result) => getOr(result, 'result', result), negate(isEmpty)),
          results
        )
      : results;
  };

const requestsInParallel = createRequestsInParallel(requestWithDefaults);

module.exports = {
  requestWithDefaults,
  requestsInParallel
};
