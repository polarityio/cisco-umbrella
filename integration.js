'use strict';

const request = require('request');
const config = require('./config/config');
const async = require('async');
const fs = require('fs');
const fp = require('lodash/fp');
const addDomainToBlocklist = require('./src/addDomainToBlocklist');
const validateOptions = require('./src/validateOptions');

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

  if (typeof config.request.passphrase === 'string' && config.request.passphrase.length > 0) {
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

const splitCommaOption = fp.flow(fp.split(','), fp.map(fp.trim));

function doLookup(entities, options, cb) {
  let lookupResults = [];
  
  options.investigateUrl = options.investigateUrl.endsWith('/') ? options.investigateUrl.slice(0, -1) : options.investigateUrl;
  options.enforcementUrl = options.enforcementUrl.endsWith('/') ? options.enforcementUrl.slice(0, -1) : options.enforcementUrl;

  const eventTypes = splitCommaOption(options.eventTypes);
  const eventSeverities = splitCommaOption(options.eventSeverities);

  Logger.trace({ entities }, 'doLookup');

  const entityLookup = fp.flow(
    fp.map((entity) => [fp.flow(fp.get('value'), fp.toLower)(entity), entity]),
    fp.fromPairs
  )(entities);

  const queryGroups = fp.flow(fp.map(fp.flow(fp.get('value'), fp.toLower)), fp.chunk(50))(entities);

  let validStatuses = new Set();
  options.statuses.forEach((status) => {
    validStatuses.add(+status.value);
  });

  async.each(
    queryGroups,
    (query, next) => {
      let requestOptions = {
        method: 'POST',
        // Umbrella REST API is case sensitive even though case should not matter for domains
        uri: `${options.investigateUrl}/domains/categorization?showlabels`,
        headers: {
          Authorization: `Bearer ${options.apiKey}`
        },
        body: query,
        json: true
      };

      Logger.trace({ requestOptions }, 'Request Options');

      requestWithDefaults(requestOptions, (err, response, body) => {
        if (err) {
          return next({
            detail: 'Error making HTTP Request',
            err: err
          });
        }

        Logger.trace({ body }, 'Result Body');

        if (response.statusCode === 403) {
          return next({
            detail: 'Invalid API Key'
          });
        }

        if (response.statusCode !== 200) {
          return next({
            detail: 'Unexpected HTTP Status Code',
            body: body
          });
        }

        for (const [entityValue, result] of Object.entries(body)) {
          if (validStatuses.has(result.status)) {
            result.statusHuman = _convertStatusToHumanReadable(result.status);
            lookupResults.push({
              entity: entityLookup[entityValue],
              data: {
                summary: _getTags(result),
                details: { ...result, eventTypes, eventSeverities }
              }
            });
          }
        }

        next();
      });
    },
    (err) => {
      cb(err, lookupResults);
    }
  );
}

function _getTags(result) {
  let tags = [];
  tags.push(`Status: ${result.statusHuman}`);
  result.security_categories.forEach((secCat) => {
    tags.push(secCat);
  });
  result.content_categories.forEach((conCat) => {
    tags.push(conCat);
  });
  return tags;
}

function _convertStatusToHumanReadable(status) {
  switch (status) {
    case 0:
      return 'Uncategorized';
    case -1:
      return 'Malicious';
    case 1:
      return 'Benign';
    default:
      return 'Unknown';
  }
}

const getOnMessage = { addDomainToBlocklist };

const onMessage = ({ action, data: actionParams }, options, callback) =>
  getOnMessage[action](actionParams, options, asyncRequestWithDefault, callback, Logger);

module.exports = {
  doLookup,
  startup,
  validateOptions,
  onMessage
};
