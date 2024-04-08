const { flow, get, map, mergeAll } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestsInParallel } = require('../request');

const getCategoryLabelsByIds = require('./getCategoryLabelsByIds');

const getCategorizations = async (entities, options) => {
  const Logger = getLogger();

  try {
    const categoriesRequests = map(
      (entity) => ({
        route: `investigate/v2/domains/categorization/${entity.value}`,
        options
      }),
      entities
    );

    const categoriesByEntityValues = mergeAll(
      await requestsInParallel(categoriesRequests, 'body')
    );

    const categoryLabelsByIds = await getCategoryLabelsByIds(options);

    const validStatuses = map(flow(get('value'), parseInt), options.statuses);

    const categorizations = map(
      (entity) => ({
        resultId: entity.value,
        result: flow(get(entity.value), (category) =>
          validStatuses.includes(get('status', category))
            ? {
                status: get('status', category),
                statusHuman:
                  STATUS_TO_HUMAN_READABLE[get('status', category)] || 'Unknown',
                security_categories: getCategoryLabels(
                  get('security_categories', category),
                  categoryLabelsByIds
                ),
                content_categories: getCategoryLabels(
                  get('content_categories', category),
                  categoryLabelsByIds
                )
              }
            : {}
        )(categoriesByEntityValues)
      }),
      entities
    );

    Logger.trace(
      { categoriesByEntityValuesResponse: categoriesByEntityValues, categorizations },
      'Categorizations Response and Results'
    );

    return categorizations;
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        formattedError: err,
        error
      },
      'Getting Categorizations Failed'
    );
    throw error;
  }
};

const getCategoryLabels = (categoryIds, categoriesByIds) =>
  map((categoryId) => categoriesByIds[categoryId], categoryIds);

const STATUS_TO_HUMAN_READABLE = {
  0: 'Uncategorized',
  '-1': 'Malicious',
  1: 'Benign'
};

module.exports = getCategorizations;
