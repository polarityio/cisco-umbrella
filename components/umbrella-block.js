'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  eventTypes: Ember.computed.alias('block.data.details.eventTypes'),
  eventSeverities: Ember.computed.alias('block.data.details.eventSeverities'),
  description: '',
  domain: '',
  url: '',
  eventType: '',
  eventSeverity: '',
  submitMessage: '',
  submitErrorMessage: '',
  submitIsRunning: false,
  statusClass: Ember.computed('details.status', function () {
    return Ember.String.htmlSafe(`status-color-${this.details.status}`);
  }),
  init() {
    const domain = this.get('block.entity.value').toLowerCase();
    this.set('domain', domain);
    this.set('url', `http://${domain}`);
    this.set('eventType', this.get('block.data.details.eventTypes')[0]);
    this.set('eventSeverity', this.get('block.data.details.eventSeverities')[0]);

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
          condition: () => !outerThis.get('url').length,
          message: 'Url is Required...'
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
            url: outerThis.get('url'),
            description: outerThis.get('description'),
            eventType: outerThis.get('eventType'),
            eventSeverity: outerThis.get('eventSeverity')
          }
        })
        .then(({ message }) => {
          outerThis.set('submitMessage', message);
        })
        .catch((err) => {
          outerThis.set(
            'submitErrorMessage',
            'Failed to submit IOC: ' + (err && (err.detail || err.message || err.title || err.description)) ||
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
