'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  eventTypes: Ember.computed.alias('block.data.details.eventTypes'),
  eventSeverities: Ember.computed.alias('block.data.details.eventSeverities'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  blockComment: 'Blocked from Polarity',
  allowComment: 'Added from Polarity',
  domain: '',
  submitBlocklistMessage: '',
  submitBlocklistErrorMessage: '',
  submitBlocklistIsRunning: false,
  removeBlocklistMessage: '',
  removeBlocklistErrorMessage: '',
  removeBlocklistIsRunning: false,
  submitAllowlistMessage: '',
  submitAllowlistErrorMessage: '',
  submitAllowlistIsRunning: false,
  removeAllowlistMessage: '',
  removeAllowlistErrorMessage: '',
  removeAllowlistIsRunning: false,
  statusClass: Ember.computed('details.status', function () {
    return Ember.String.htmlSafe(`status-color-${this.details.status}`);
  }),

  init() {
    this.set('domain', this.get('block.entity.value').toLowerCase());

    this._super(...arguments);
  },
  actions: {
    addDomainToBlocklist: function () {
      const outerThis = this;
      const possibleParamErrors = [
        {
          condition: () => !outerThis.get('domain').length,
          message: 'Domain is Required...'
        },
        {
          condition: () => !outerThis.get('blockComment').length,
          message: 'Comment is Required...'
        }
      ];

      const paramErrorMessages = possibleParamErrors.reduce(
        (agg, possibleParamError) =>
          possibleParamError.condition() ? agg.concat(possibleParamError.message) : agg,
        []
      );

      if (paramErrorMessages.length) {
        outerThis.set('submitBlocklistErrorMessage', paramErrorMessages[0]);
        outerThis.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          outerThis.set('submitBlocklistErrorMessage', '');
          outerThis.get('block').notifyPropertyChange('data');
        }, 5000);
        return;
      }

      outerThis.set('submitBlocklistMessage', '');
      outerThis.set('submitBlocklistErrorMessage', '');
      outerThis.set('submitBlocklistIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');
      outerThis
        .sendIntegrationMessage({
          action: 'addDomainToBlocklist',
          data: {
            domain: outerThis.get('domain'),
            comment: outerThis.get('blockComment')
          }
        })
        .then(({ message, isInBlocklist }) => {
          outerThis.set('details.isInBlocklist', isInBlocklist);
          outerThis.set('removeBlocklistMessage', message);
        })
        .catch((err) => {
          outerThis.set(
            'submitBlocklistErrorMessage',
            'Failed to Block Domain: ' +
              (err && (err.detail || err.message || err.title || err.comment)) ||
              'Unknown Reason'
          );
        })
        .finally(() => {
          outerThis.set('submitBlocklistIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('removeBlocklistMessage', '');
            outerThis.set('submitBlocklistErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    },
    removeDomainFromBlocklist: function () {
      const outerThis = this;

      outerThis.set('removeBlocklistMessage', '');
      outerThis.set('removeBlocklistErrorMessage', '');
      outerThis.set('removeBlocklistIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');
      outerThis
        .sendIntegrationMessage({
          action: 'removeDomainFromBlocklist',
          data: { isInBlocklist: outerThis.get('details.isInBlocklist') }
        })
        .then(({ message }) => {
          outerThis.set('details.isInBlocklist', false);
          outerThis.set('submitBlocklistMessage', message);
        })
        .catch((err) => {
          outerThis.set(
            'removeBlocklistErrorMessage',
            'Failed to Remove Domain from Blocklist: ' +
              (err && (err.detail || err.message || err.title || err.comment)) ||
              'Unknown Reason'
          );
        })
        .finally(() => {
          outerThis.set('removeBlocklistIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('submitBlocklistMessage', '');
            outerThis.set('removeBlocklistErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    },
    addDomainToAllowlist: function () {
      const outerThis = this;
      const possibleParamErrors = [
        {
          condition: () => !outerThis.get('domain').length,
          message: 'Domain is Required...'
        },
        {
          condition: () => !outerThis.get('allowComment').length,
          message: 'Comment is Required...'
        }
      ];

      const paramErrorMessages = possibleParamErrors.reduce(
        (agg, possibleParamError) =>
          possibleParamError.condition() ? agg.concat(possibleParamError.message) : agg,
        []
      );

      if (paramErrorMessages.length) {
        outerThis.set('submitAllowlistErrorMessage', paramErrorMessages[0]);
        outerThis.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          outerThis.set('submitAllowlistErrorMessage', '');
          outerThis.get('block').notifyPropertyChange('data');
        }, 5000);
        return;
      }

      outerThis.set('submitAllowlistMessage', '');
      outerThis.set('submitAllowlistErrorMessage', '');
      outerThis.set('submitAllowlistIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');
      outerThis
        .sendIntegrationMessage({
          action: 'addDomainToAllowlist',
          data: {
            domain: outerThis.get('domain'),
            comment: outerThis.get('allowComment')
          }
        })
        .then(({ message, isInAllowlist }) => {
          outerThis.set('details.isInAllowlist', isInAllowlist);
          outerThis.set('removeAllowlistMessage', message);
        })
        .catch((err) => {
          outerThis.set(
            'submitAllowlistErrorMessage',
            'Failed to Block Domain: ' +
              (err && (err.detail || err.message || err.title || err.comment)) ||
              'Unknown Reason'
          );
        })
        .finally(() => {
          outerThis.set('submitAllowlistIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('removeAllowlistMessage', '');
            outerThis.set('submitAllowlistErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    },
    removeDomainFromAllowlist: function () {
      const outerThis = this;

      outerThis.set('removeAllowlistMessage', '');
      outerThis.set('removeAllowlistErrorMessage', '');
      outerThis.set('removeAllowlistIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');
      outerThis
        .sendIntegrationMessage({
          action: 'removeDomainFromAllowlist',
          data: { isInAllowlist: outerThis.get('details.isInAllowlist') }
        })
        .then(({ message }) => {
          outerThis.set('details.isInAllowlist', false);
          outerThis.set('submitAllowlistMessage', message);
        })
        .catch((err) => {
          outerThis.set(
            'removeAllowlistErrorMessage',
            'Failed to Remove Domain from Allowlist: ' +
              (err && (err.detail || err.message || err.title || err.comment)) ||
              'Unknown Reason'
          );
        })
        .finally(() => {
          outerThis.set('removeAllowlistIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('submitAllowlistMessage', '');
            outerThis.set('removeAllowlistErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    }
  }
});
