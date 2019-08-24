'use strict';
polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  statusClass: Ember.computed('details.status', function() {
    return Ember.String.htmlSafe(`status-color-${this.details.status}`);
  })
});
