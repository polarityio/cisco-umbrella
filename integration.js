'use strict';

const request = require('postman-request');
const config = require('./config/config');
const async = require('async');
const fs = require('fs');
const NodeCache = require('node-cache');

const {
  compact,
  flow,
  split,
  map,
  trim,
  get,
  toLower,
  chunk,
  fromPairs
} = require('lodash/fp');

// Number of seconds before the API Key should expire to expire it
const EXPIRE_THRESHOLD = 120;

const validateOptions = require('./src/validateOptions');
const getCategorization = require('./src/getCategorization');
const addBlocklistDataToLookupResults = require('./src/addBlocklistDataToLookupResults');
const addAllowlistDataToLookupResults = require('./src/addAllowlistDataToLookupResults');
const addWhoIsDataToLookupResults = require('./src/addWhoIsDataToLookupResults');
const addDomainToBlocklist = require('./src/addDomainToBlocklist');
const removeDomainFromBlocklist = require('./src/removeDomainFromBlocklist');
const addDomainToAllowlist = require('./src/addDomainToAllowlist');
const removeDomainFromAllowlist = require('./src/removeDomainFromAllowlist');

let Logger;
let requestWithDefaults;
let asyncRequestWithDefault;

const tokenCache = new NodeCache();

function startup(logger) {
  Logger = logger;
  let defaults = {};

  if (typeof config.request.cert === 'string' && config.request.cert.length > 0) {
    defaults.cert = fs.readFileSync(config.request.cert);
  }

  if (typeof config.request.key === 'string' && config.request.key.length > 0) {
    defaults.key = fs.readFileSync(config.request.key);
  }

  if (
    typeof config.request.passphrase === 'string' &&
    config.request.passphrase.length > 0
  ) {
    defaults.passphrase = config.request.passphrase;
  }

  if (typeof config.request.ca === 'string' && config.request.ca.length > 0) {
    defaults.ca = fs.readFileSync(config.request.ca);
  }

  if (typeof config.request.proxy === 'string' && config.request.proxy.length > 0) {
    defaults.proxy = config.request.proxy;
  }

  requestWithDefaults = request.defaults(defaults);

  asyncRequestWithDefault = (requestOptions) =>
    new Promise((resolve, reject) => {
      requestWithDefaults(requestOptions, (err, res, body) => {
        if (err) return reject(err);
        resolve({ ...res, body });
      });
    });
}

async function doLookup(entities, options, cb) {
  let lookupResults = [];

  options.investigateUrl = options.investigateUrl.endsWith('/')
    ? options.investigateUrl.slice(0, -1)
    : options.investigateUrl;

  options.umbrellaUrl = options.umbrellaUrl.endsWith('/')
    ? options.umbrellaUrl.slice(0, -1)
    : options.umbrellaUrl;

  Logger.trace({ entities }, 'doLookup');

  try {
    const token = await getToken(options, asyncRequestWithDefault, Logger);

    const eventTypes = splitCommaOption(options.eventTypes);
    const eventSeverities = splitCommaOption(options.eventSeverities);

    const entityLookup = flow(
      map((entity) => [flow(get('value'), toLower)(entity), entity]),
      fromPairs
    )(entities);

    const queryGroups = getQueryGroups(entities);

    let validStatuses = new Set();

    options.statuses.forEach((status) => {
      validStatuses.add(+status.value);
    });

    await async.each(
      queryGroups,
      getCategorization(
        eventTypes,
        eventSeverities,
        entityLookup,
        validStatuses,
        lookupResults,
        options,
        requestWithDefaults,
        Logger
      )
    );
    lookupResults = await addBlocklistDataToLookupResults(
      token,
      lookupResults,
      options,
      asyncRequestWithDefault,
      Logger
    );
    lookupResults = await addAllowlistDataToLookupResults(
      token,
      lookupResults,
      options,
      asyncRequestWithDefault,
      Logger
    );
    lookupResults = await addWhoIsDataToLookupResults(
      lookupResults,
      options,
      asyncRequestWithDefault,
      Logger
    );
    Logger.trace({ lookupResults }, 'Lookup Results');
    return cb(null, lookupResults);
  } catch (err) {
    if (err) {
      let jsonError = parseErrorToReadableJSON(err);
      Logger.error({ err: jsonError }, 'Error running lookup');
      return cb(jsonError);
    }

    cb(null, lookupResults);
  }
}

async function getToken(options, asyncRequestWithDefault, Logger) {
  if (tokenCache.has(options.apiKey)) {
    Logger.debug('Using cached token');
    return tokenCache.get(options.apiKey);
  }

  Logger.debug('Generating fresh token');
  const response = await asyncRequestWithDefault({
    url: `${options.umbrellaUrl}/auth/v2/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      user: options.apiKey,
      pass: options.secretKey
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  });

  tokenCache.set(
    options.apiKey,
    response.body,
    response.body.expires_in - EXPIRE_THRESHOLD
  );

  return response.body;
}

function parseErrorToReadableJSON(error) {
  return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
}

const splitCommaOption = flow(split(','), map(trim), compact);
const getQueryGroups = flow(map(flow(get('value'), toLower)), chunk(50));

async function onMessage(payload, options, callback) {
  let token;
  try {
    token = await getToken(options, asyncRequestWithDefault, Logger);
  } catch (tokenErr) {
    let jsonErr = parseErrorToReadableJSON(tokenErr);
    Logger.error({ err: jsonErr }, 'Error getting token in onMessage');
    cb(jsonErr);
  }

  switch (payload.action) {
    case 'addDomainToBlocklist':
      await addDomainToBlocklist(
        payload.data,
        token,
        options,
        asyncRequestWithDefault,
        callback,
        Logger
      );
    case 'addDomainToAllowlist':
      await addDomainToAllowlist(
        payload.data,
        token,
        options,
        asyncRequestWithDefault,
        callback,
        Logger
      );
    case 'removeDomainFromAllowlist':
      await removeDomainFromAllowlist(
        payload.data,
        token,
        options,
        asyncRequestWithDefault,
        callback,
        Logger
      );
    case 'removeDomainFromBlocklist':
      await removeDomainFromBlocklist(
        payload.data,
        token,
        options,
        asyncRequestWithDefault,
        callback,
        Logger
      );
    default:
      return callback({ err: 'Invalid action' });
  }
}

module.exports = {
  doLookup,
  startup,
  validateOptions,
  onMessage
};
