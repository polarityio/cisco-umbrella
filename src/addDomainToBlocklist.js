const moment = require('moment');
const { version } = require('../package.json');


const addDomainToBlocklist = async (
  { domain, url, description, eventType, eventSeverity },
  options,
  requestWithDefaults,
  callback,
  Logger
) => {
  try {
    const time = `${moment().format('YYYY-MM-DDTHH:mm:ss.S')}Z`;

    let requestOptions = {
      method: 'POST',
      uri: `${options.enforcementUrl}/1.0/events`,
      qs: {
        customerKey: options.customerKey
      },
      body: {
        dstDomain: domain.toLowerCase(),
        dstUrl: url.toLowerCase(),
        ...(description && { eventDescription: description }),
        ...(eventType && { eventType }),
        ...(eventSeverity && { eventSeverity }),
        disableDstSafeguards: true,
        alertTime: time,
        eventTime: time,
        protocolVersion: '1.0a',
        providerName: 'Security Platform',
        deviceId: 'Polarity Integration',
        deviceVersion: version
      },
      json: true
    };

    Logger.trace({ requestOptions }, 'Add to Blocklist Event Request Options');

    let statusCode, body;
    try {
      const result = await requestWithDefaults(requestOptions);
      statusCode = result.statusCode;
      body = result.body;
    } catch (requestError) {
      Logger.error(requestError, "Request Error")
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
    possibleError.message =
      (body.message && body.message.includes('There were one or more missing or required fields')
        ? 'Domain or Url is not formatted correctly'
        : body.message) || 'Unexpected HTTP Status Code';
    possibleError.context = { ...body, statusCode };
    throw possibleError;
  }
}


module.exports = addDomainToBlocklist;