const { size, map, some } = require('lodash/fp');
const { getResultForThisEntity } = require('./dataTransformations');

const assembleLookupResults = (
  entities,
  categorizations,
  whois,
  allowListDestinations,
  blockListDestinations,
  options
) =>
  map((entity) => {
    const resultsForThisEntity = getResultsForThisEntity(
      entity,
      categorizations,
      whois,
      allowListDestinations,
      blockListDestinations,
      options
    );

    const resultsFound = some(size, resultsForThisEntity);

    const lookupResult = {
      entity,
      data: resultsFound
        ? {
            summary: createSummaryTags(resultsForThisEntity, options),
            details: resultsForThisEntity
          }
        : null
    };

    return lookupResult;
  }, entities);

const getResultsForThisEntity = (
  entity,
  categorizations,
  whois,
  allowListDestinations,
  blockListDestinations,
  options
) => {
  const categorization = getResultForThisEntity(entity, categorizations);
  return !size(categorization)
    ? null
    : {
        categorization,
        whois: getResultForThisEntity(entity, whois),
        isInAllowlist: getResultForThisEntity(entity, allowListDestinations),
        isInBlocklist: getResultForThisEntity(entity, blockListDestinations)
      };
};

const createSummaryTags = (
  { categorization, whois, isInAllowlist, isInBlocklist },
  options
) =>
  []
    .concat(size(whois) ? 'WHOIS' : [])
    .concat(size(categorization) ? `Status: ${categorization.statusHuman}` : [])
    .concat(size(isInAllowlist) ? 'In Allowlist' : [])
    .concat(size(isInBlocklist) ? 'In Blocklist' : []);

module.exports = assembleLookupResults;
