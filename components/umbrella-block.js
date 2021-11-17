'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  eventTypes: Ember.computed.alias('block.data.details.eventTypes'),
  eventSeverities: Ember.computed.alias('block.data.details.eventSeverities'),
  comment: 'Blocked from Polarity',
  domain: '',
  submitMessage: '',
  submitErrorMessage: '',
  submitIsRunning: false,
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
          condition: () => !outerThis.get('comment').length,
          message: 'Comment is Required...'
        }
      ];

      const paramErrorMessages = possibleParamErrors.reduce(
        (agg, possibleParamError) => (possibleParamError.condition() ? agg.concat(possibleParamError.message) : agg),
        []
      );

      if (paramErrorMessages.length) {
        outerThis.set('submitErrorMessage', paramErrorMessages[0]);
        outerThis.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          outerThis.set('submitErrorMessage', '');
          outerThis.get('block').notifyPropertyChange('data');
        }, 5000);
        return;
      }

      outerThis.set('submitMessage', '');
      outerThis.set('submitErrorMessage', '');
      outerThis.set('submitIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');
      outerThis
        .sendIntegrationMessage({
          action: 'addDomainToBlocklist',
          data: {
            domain: outerThis.get('domain'),
            comment: outerThis.get('comment')
          }
        })
        .then(({ message }) => {
          outerThis.set('submitMessage', message);
        })
        .catch((err) => {
          outerThis.set(
            'submitErrorMessage',
            'Failed to Block Domain: ' + (err && (err.detail || err.message || err.title || err.comment)) ||
              'Unknown Reason'
          );
        })
        .finally(() => {
          outerThis.set('submitIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('submitMessage', '');
            outerThis.set('submitErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    }
  }
});
