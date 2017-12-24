import {describe, beforeEach, it, sinon, expect, angularMocks} from '../lib/common';
import AzureMonitorFilterBuilder from '../../src/azure_monitor/azure_monitor_filter_builder';
import moment from 'moment';

describe('AzureMonitorFilterBuilder', function() {
  let builder: AzureMonitorFilterBuilder;

  const timefilter = 'timespan=2017-08-22T06:00:00Z/2017-08-22T07:00:00Z';
  const metricFilter = 'metric=Percentage CPU';

  beforeEach(function() {
    builder = new AzureMonitorFilterBuilder(
      'Percentage CPU',
      moment.utc('2017-08-22 06:00'),
      moment.utc('2017-08-22 07:00'),
      1,
      'hour',
      '3m'
    );
  });

  describe('with a metric name and auto time grain of 3 minutes', function() {
    beforeEach(function() {
      builder.timeGrain = null;
    });

    it('should always add datetime filtering and a time grain rounded to the closest allowed value to the filter', function() {
      const filter = timefilter + '&interval=PT5M&' + metricFilter;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });

  describe('with a metric name and auto time grain of 30 seconds', function() {
    beforeEach(function() {
      builder.timeGrain = null;
      builder.grafanaInterval = '30s';
    });

    it('should always add datetime filtering and a time grain in ISO_8601 format to the filter', function() {
      const filter = timefilter + '&interval=PT1M&' + metricFilter;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });

  describe('with a metric name and auto time grain of 10 minutes', function() {
    beforeEach(function() {
      builder.timeGrain = null;
      builder.grafanaInterval = '10m';
    });

    it('should always add datetime filtering and a time grain rounded to the closest allowed value to the filter', function() {
      const filter = timefilter + '&interval=PT15M&' + metricFilter;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });

  describe('with a metric name and auto time grain of 2 day', function() {
    beforeEach(function() {
      builder.timeGrain = null;
      builder.grafanaInterval = '2d';
    });

    it('should always add datetime filtering and a time grain rounded to the closest allowed value to the filter', function() {
      const filter = timefilter + '&interval=P1D&' + metricFilter;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });

  describe('with a metric name and 1 hour time grain', function() {
    it('should always add datetime filtering and a time grain in ISO_8601 format to the filter', function() {
      const filter = timefilter + '&interval=PT1H&' + metricFilter;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });

  describe('with a metric name and 1 minute time grain', function() {
    beforeEach(function() {
      builder.timeGrainUnit = 'minute';
    });

    it('should always add datetime filtering and a time grain in ISO_8601 format to the filter', function() {
      const filter = timefilter + '&interval=PT1M&' + metricFilter;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });

  describe('with a metric name and 1 day time grain', function() {
    beforeEach(function() {
      builder.timeGrainUnit = 'day';
    });

    it('should add time grain to the filter in ISO_8601 format', function() {
      const filter = timefilter + '&interval=P1D&' + metricFilter;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });

  describe('with a metric name and 1 day time grain and an aggregation', function() {
    beforeEach(function() {
      builder.timeGrainUnit = 'day';
      builder.setAggregation('Maximum');
    });

    it('should add time grain to the filter in ISO_8601 format', function() {
      const filter = timefilter + '&interval=P1D&aggregation=Maximum&' + metricFilter;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });

  describe('with a metric name and 1 day time grain and an aggregation', function() {
    beforeEach(function() {
      builder.setDimensionFilter('aDimension', 'aFilterValue');
    });

    it('should add time grain to the filter in ISO_8601 format', function() {
      const filter = timefilter + '&interval=PT1H&' + metricFilter
        + `&$filter=aDimension eq 'aFilterValue'`;
      expect(builder.generateFilter()).to.equal(filter);
    });
  });
});
