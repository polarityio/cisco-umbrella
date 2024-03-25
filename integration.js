const {
  logging: { setLogger, getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { validateOptions } = require('./server/userOptions');
const { removePrivateIps } = require('./server/dataTransformations');
const {
  getAllowListDestinations,
  getBlockListDestinations,
  getCategorizations,
  getWhois
} = require('./server/queries');
const assembleLookupResults = require('./server/assembleLookupResults');
const onMessageFunctions = require('./server/onMessage');

const doLookup = async (entities, options, cb) => {
  const Logger = getLogger();
  try {
    Logger.debug({ entities }, 'Entities');

    const searchableEntities = removePrivateIps(entities);

    const [categorizations, whois, allowListDestinations, blockListDestinations] =
      await Promise.all([
        getCategorizations(searchableEntities, options),
        options.getWhoIsData ? getWhois(searchableEntities, options) : [],
        getAllowListDestinations(searchableEntities, options),
        getBlockListDestinations(searchableEntities, options)
      ]);

    Logger.trace({
      categorizations,
      whois,
      allowListDestinations,
      blockListDestinations
    });

    const lookupResults = assembleLookupResults(
      entities,
      categorizations,
      whois,
      allowListDestinations,
      blockListDestinations,
      options
    );

    Logger.trace({ lookupResults }, 'Lookup Results');

    cb(null, lookupResults);
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    Logger.error({ error, formattedError: err }, 'Get Lookup Results Failed');
    cb({ detail: error.message || 'Lookup Failed', err });
  }
};

const onMessage = ({ action, data: actionParams }, options, callback) =>
  onMessageFunctions[action](actionParams, options, callback);

module.exports = {
  startup: setLogger,
  validateOptions,
  doLookup,
  onMessage
};
