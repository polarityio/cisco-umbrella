'use strict';

const request = require('request');
const config = require('./config/config');
const async = require('async');
const fs = require('fs');

let Logger;
let requestWithDefaults;

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
}

function doLookup(entities, options, cb) {
  let lookupResults = [];

  Logger.trace({ entities }, 'doLookup');

  let entityLookup = new Map();
  let queryGroups = [[]];
  let groupIndex = 0;
  let entityCount = 0;

  entities.forEach((entity) => {
    entityLookup.set(entity.value.toLowerCase(), entity);
    queryGroups[groupIndex].push(entity.value);
    entityCount++;
    if (entityCount > 50) {
      groupIndex++;
      queryGroups.push([]);
    }
  });

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
        uri: `${options.url}/domains/categorization?showlabels`,
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
              entity: entityLookup.get(entityValue),
              data: {
                summary: _getTags(result),
                details: result
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

function validateOptions(userOptions, cb) {
  let errors = [];
  if (
    typeof userOptions.apiKey.value !== 'string' ||
    (typeof userOptions.apiKey.value === 'string' && userOptions.apiKey.value.length === 0)
  ) {
    errors.push({
      key: 'apiKey',
      message: 'You must provide a valid API key'
    });
  }
  cb(null, errors);
}

module.exports = {
  doLookup: doLookup,
  startup: startup,
  validateOptions: validateOptions
};
