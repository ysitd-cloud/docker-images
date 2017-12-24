/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export default class TimeGrainConverter {
    static createISO8601Duration(timeGrain: any, timeGrainUnit: any): string;
    static createISO8601DurationFromInterval(interval: string): string;
    static findClosestTimeGrain(interval: any, allowedTimeGrains: any): any;
}
