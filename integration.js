'use strict';

const request = require('postman-request');
const config = require('./config/config');
const async = require('async');
const fs = require('fs');

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

const validateOptions = require('./src/validateOptions');
const getCategorization = require('./src/getCategorization');
const addBlocklistDataToLookupResults = require('./src/addBlocklistDataToLookupResults');
const addDomainToBlocklist = require('./src/addDomainToBlocklist');
const removeDomainFromBlocklist = require('./src/removeDomainFromBlocklist');
const addAllowlistDataToLookupResults = require('./src/addAllowlistDataToLookupResults');
const addDomainToAllowlist = require('./src/addDomainToAllowlist');
const removeDomainFromAllowlist = require('./src/removeDomainFromAllowlist');

let Logger;
let requestWithDefaults;
let asyncRequestWithDefault;

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

  options.managementUrl = options.managementUrl.endsWith('/')
    ? options.managementUrl.slice(0, -1)
    : options.managementUrl;

  Logger.trace({ entities }, 'doLookup');

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

  try {
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
      lookupResults,
      options,
      asyncRequestWithDefault,
      Logger
    );

    lookupResults = await addAllowlistDataToLookupResults(
      lookupResults,
      options,
      asyncRequestWithDefault,
      Logger
    );

    return cb(null, lookupResults);
  } catch (err) {
    cb(err, lookupResults);
  }
}

const splitCommaOption = flow(split(','), map(trim), compact);

const getQueryGroups = flow(
  map(flow(get('value'), toLower)),
  chunk(50)
);

const getOnMessage = {
  addDomainToBlocklist,
  removeDomainFromBlocklist,
  addDomainToAllowlist,
  removeDomainFromAllowlist
};

const onMessage = ({ action, data: actionParams }, options, callback) =>
  getOnMessage[action](actionParams, options, asyncRequestWithDefault, callback, Logger);

module.exports = {
  doLookup,
  startup,
  validateOptions,
  onMessage
};
