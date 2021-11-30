const STATUS_TO_HUMAN_READABLE = {
  0: 'Uncategorized',
  '-1': 'Malicious',
  1: 'Benign'
};

const getCategorization =
  (
    eventTypes,
    eventSeverities,
    entityLookup,
    validStatuses,
    lookupResults,
    options,
    requestWithDefaults,
    Logger
  ) =>
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
          result.statusHuman = STATUS_TO_HUMAN_READABLE[result.status] || 'Unknown';
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
  };

const _getTags = (result) => [
  `Status: ${result.statusHuman}`,
  ...(result.security_categories || []),
  ...(result.content_categories || [])
];

module.exports = getCategorization;