const { get, reduce, capitalize } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');

const NodeCache = require('node-cache');
const categoriesByIdsCache = new NodeCache({ stdTTL: 6 * 60 * 60 });

const getCategoryLabelsByIds = async (options) => {
  const Logger = getLogger();
  
  try {
    const categoriesByIdsCacheKey = options.apiKey + options.secretKey;
    const categoriesByIdsFromCache = categoriesByIdsCache.get(categoriesByIdsCacheKey);
    if (categoriesByIdsFromCache) {
      Logger.trace({ categoriesByIdsFromCache }, 'Obtained Categories By Ids From Cache');
      return categoriesByIdsFromCache;
    }

    const categories = get(
      'body.data',
      await requestWithDefaults({
        route: 'reports/v2/categories',
        options
      })
    );

    const categoriesByIds = reduce(
      (agg, { id, label, type, deprecated, integration }) => ({
        ...agg,
        [id]: `${label} (Type - ${capitalize(type)}${deprecated ? ' | Deprecated' : ''}${
          integration ? ' | Integration' : ''
        })`
      }),
      {},
      categories
    );

    Logger.trace(
      { categoriesResponse: categories, categoriesByIds },
      'Obtained Categories By Ids From Request'
    );

    categoriesByIdsCache.set(categoriesByIdsCacheKey, categoriesByIds);

    return categoriesByIds;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Category Labels By Ids Failed'
    );
    throw error;
  }
};

module.exports = getCategoryLabelsByIds;
