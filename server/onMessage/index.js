const addDomainToAllowlist = require('./addDomainToAllowlist');
const addDomainToBlocklist = require('./addDomainToBlocklist');
const removeDomainFromAllowlist = require('./removeDomainFromAllowlist');
const removeDomainFromBlocklist = require('./removeDomainFromBlocklist');

module.exports = {
  addDomainToAllowlist,
  addDomainToBlocklist,
  removeDomainFromAllowlist,
  removeDomainFromBlocklist
};
