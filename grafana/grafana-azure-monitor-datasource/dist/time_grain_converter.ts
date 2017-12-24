///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import kbn from 'app/core/utils/kbn';

export default class TimeGrainConverter {
  static createISO8601Duration(timeGrain, timeGrainUnit) {
    const timeIntervals = ['hour', 'minute', 'h', 'm'];
    if (_.includes(timeIntervals, timeGrainUnit)) {
      return `PT${timeGrain}${timeGrainUnit[0].toUpperCase()}`;
    }

    return `P${timeGrain}${timeGrainUnit[0].toUpperCase()}`;
  }

  static createISO8601DurationFromInterval(interval: string) {
    const timeGrain = +interval.slice(0, interval.length - 1);
    const unit = interval[interval.length - 1];

    if (interval.indexOf('ms') > -1) {
      return TimeGrainConverter.createISO8601Duration(1, 'm');
    }

    if (interval[interval.length - 1] === 's') {
      let toMinutes = (timeGrain * 60) % 60;

      if (toMinutes < 1) {
        toMinutes = 1;
      }

      return TimeGrainConverter.createISO8601Duration(toMinutes, 'm');
    }

    return TimeGrainConverter.createISO8601Duration(timeGrain, unit);
  }

  static findClosestTimeGrain(interval, allowedTimeGrains) {
    let closest = allowedTimeGrains[0];
    const intervalMs = kbn.interval_to_ms(interval);

    for (let i = 0; i < allowedTimeGrains.length; i++) {
      // abs (num - val) < abs (num - curr):
      if (intervalMs > kbn.interval_to_ms(allowedTimeGrains[i])) {
        if ((i + 1) < allowedTimeGrains.length) {
          closest = allowedTimeGrains[i + 1];
        } else {
          closest = allowedTimeGrains[i];
        }
      }
    }

    return closest;
  }
}
