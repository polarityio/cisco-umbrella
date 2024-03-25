const { flow, get, map } = require('lodash/fp');
const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults } = require('../request');

const getCategoryLabelsByIds = require('./getCategoryLabelsByIds');

const getCategorizations = async (entities, options) => {
  const Logger = getLogger();

  try {
    const categoriesByEntityValues = get(
      'body',
      await requestWithDefaults({
        method: 'POST',
        route: 'investigate/v2/domains/categorization',
        headers: {
          'Content-Type': 'application/json'
        },
        body: map('value', entities),
        options
      })
    );

    const categoryLabelsByIds = await getCategoryLabelsByIds(options);

    const validStatuses = map(flow(get('value'), parseInt), options.statuses)
    const categorizations = map(
      (entity) => ({
        resultId: entity.value,
        result: flow(get(entity.value), (category) =>
          validStatuses.includes(category.status)
            ? {
                status: category.status,
                statusHuman: STATUS_TO_HUMAN_READABLE[category.status] || 'Unknown',
                security_categories: getCategoryLabels(
                  category.security_categories,
                  categoryLabelsByIds
                ),
                content_categories: getCategoryLabels(
                  category.content_categories,
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
