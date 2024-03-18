const {
  map,
  filter,
  get,
  flow,
  eq,
  flatMap,
  uniqWith,
  isEqual,
  identity,
  split,
  trim,
  uniq,
  compact,
  first
} = require('lodash/fp');

const isPrivateIP = (ip) => {
  var parts = ip.split('.');
  return (
    parts[0] === '10' ||
    (parts[0] === '172' &&
      parseInt(parts[1], 10) >= 16 &&
      parseInt(parts[1], 10) <= 31) ||
    (parts[0] === '192' && parts[1] === '168')
  );
};

const removePrivateIps = (entities) =>
  filter(({ isIP, value }) => !isIP || (isIP && !isPrivateIP(value)), entities);

const getResultForThisEntity = (
  entity,
  results,
  onlyOneResultExpected = true,
  onlyReturnUniqueResults = false
) =>
  flow(
    filter(flow(get('resultId'), eq(entity.value))),
    flatMap(get('result')),
    onlyReturnUniqueResults ? uniqWith(isEqual) : identity,
    onlyOneResultExpected ? first : identity
  )(results);

const splitCommaSeparatedUserOption = (key, options) =>
  flow(get(key), split(','), map(trim), compact, uniq)(options);

module.exports = {
  removePrivateIps,
  getResultForThisEntity,
  splitCommaSeparatedUserOption
};
