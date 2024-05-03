const fs = require('fs');

const request = require('postman-request');
const { get, isEmpty, getOr, omit, flow, getOr, parseInt, min } = require('lodash/fp');
const Bottleneck = require('bottleneck');

const { logging, errors } = require('polarity-integration-utils');

const _configFieldIsValid = (field) => typeof field === 'string' && field.length > 0;

const NodeCache = require('node-cache');
const limiterCache = new NodeCache();

const setLimiterFromResponseHeaders = (route, headers) => {
  const limiterFromCache = limiterCache.get(route);
  const minuteRateLimit = flow(getOr(0, 'x-ratelimit-limit-minute'), parseInt)(headers);
  if (limiterFromCache || !minuteRateLimit) return;

  const minimumMillisecondsRequestWillTake = 60000 / (minuteRateLimit - 1);

  const limiterToCache = new Bottleneck({
    maxConcurrent: 1, // no more than 5 lookups can be running at single time
    highWater: 200, // no more than 50 lookups can be queued up
    strategy: Bottleneck.strategy.OVERFLOW,
    minTime: minimumMillisecondsRequestWillTake
  });

  limiterCache.set(route, limiterToCache);
};

const createRequestWithDefaults = ({
  config: { request: { ca, cert, key, passphrase, rejectUnauthorized, proxy, json } } = {
    request: {
      ca: '',
      cert: '',
      key: '',
      passphrase: '',
      proxy: '',
      rejectUnauthorized: false,
      json: true
    }
  },
  roundedSuccessStatusCodes = [200],
  useLimiter = false,
  requestOptionsToOmitFromLogsKeyPaths = ['headers.Authorization'],
  preprocessRequestOptions = async (requestOptions) => requestOptions,
  postprocessRequestResponse = async (response, requestOptions) => response,
  postprocessRequestFailure = async (error, requestOptions) => {
    throw error;
  }
}) => {
  const defaultsProxyOptions = {
    ...(_configFieldIsValid(ca) && { ca: fs.readFileSync(ca) }),
    ...(_configFieldIsValid(cert) && { cert: fs.readFileSync(cert) }),
    ...(_configFieldIsValid(key) && { key: fs.readFileSync(key) }),
    ...(_configFieldIsValid(passphrase) && { passphrase }),
    ...(_configFieldIsValid(proxy) && { proxy }),
    ...(typeof rejectUnauthorized === 'boolean' && { rejectUnauthorized }),
    json
  };

  const requestDefaultsWithInterceptors = requestWithDefaultsBuilder(
    defaultsProxyOptions,
    roundedSuccessStatusCodes,
    useLimiter,
    requestOptionsToOmitFromLogsKeyPaths,
    preprocessRequestOptions,
    postprocessRequestResponse,
    postprocessRequestFailure
  );

  return requestDefaultsWithInterceptors;
};

export const requestWithDefaultsBuilder = (
  defaultsProxyOptions,
  roundedSuccessStatusCodes,
  useLimiter,
  requestOptionsToOmitFromLogsKeyPaths,
  preprocessRequestOptions,
  postprocessRequestResponse,
  postprocessRequestFailure
) => {
  const defaultsRequest = request.defaults(defaultsProxyOptions);

  const _requestWithDefaults = (requestOptions) =>
    new Promise((resolve, reject) => {
      defaultsRequest(requestOptions, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

  return async (requestOptions) => {
    const limiter = limiterCache.get(requestOptions.route);

    const preRequestFunctionResults = await preprocessRequestOptions(requestOptions);
    const _requestOptions = {
      ...requestOptions,
      ...preRequestFunctionResults
    };

    let postRequestFunctionResults, result;
    try {
      result = await (limiter
        ? limiter.schedule(_requestWithDefaults, _requestOptions)
        : _requestWithDefaults(_requestOptions));

      checkForStatusError(
        result,
        _requestOptions,
        roundedSuccessStatusCodes,
        requestOptionsToOmitFromLogsKeyPaths
      );

      setLimiterFromResponseHeaders(requestOptions.route, result.headers);

      postRequestFunctionResults = await postprocessRequestResponse(
        result,
        _requestOptions
      );
    } catch (error) {
      try {
        postRequestFunctionResults = await postprocessRequestFailure(
          error,
          _requestOptions
        );
      } catch (error) {
        const err = errors.parseErrorToReadableJson(error);

        if (useLimiter) {
          error.maxRequestQueueLimitHit =
            (isEmpty(err) && isEmpty(result)) ||
            (err &&
              (err.message ===
                'This job has been dropped by Bottleneck for going over API Limits' ||
                err instanceof Bottleneck.BottleneckError));

          error.isConnectionReset =
            getOr('', 'errors[0].meta.err.code', err) === 'ECONNRESET';
        }

        if (_requestOptions.entity) error.entity = JSON.stringify(_requestOptions.entity);

        throw error;
      }
    }
    return postRequestFunctionResults;
  };
};

const checkForStatusError = (
  { statusCode, body },
  requestOptions,
  roundedSuccessStatusCodes,
  requestOptionsToOmitFromLogsKeyPaths
) => {
  const Logger = logging.getLogger();

  const requestOptionsWithoutSensitiveData = omit(
    requestOptionsToOmitFromLogsKeyPaths.concat('options'),
    requestOptions
  );

  Logger.trace({
    MESSAGE: 'Request Ran, Checking Status...',
    statusCode,
    requestOptions: requestOptionsWithoutSensitiveData,
    responseBody: body
  });

  const roundedStatus = Math.round(statusCode / 100) * 100;
  const statusCodeNotSuccessful = !roundedSuccessStatusCodes.includes(roundedStatus);
  const responseBodyError = get('error', body);

  if (statusCodeNotSuccessful || responseBodyError) {
    const message = get('message', responseBodyError);
    const status = statusCodeNotSuccessful ? statusCode : get('code', responseBodyError);
    const description = JSON.stringify(body);
    const requestOptions = JSON.stringify(requestOptionsWithoutSensitiveData);
    const requestError = new errors.RequestError(
      message,
      status,
      description,
      requestOptions
    );

    throw requestError;
  }
};

module.exports = createRequestWithDefaults;
