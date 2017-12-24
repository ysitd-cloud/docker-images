/// <reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export default class UrlBuilder {
    static buildAzureMonitorQueryUrl(baseUrl: string, resourceGroup: string, metricDefinition: string, resourceName: string, apiVersion: string, filter: string): string;
    static buildAzureMonitorGetMetricNamesUrl(baseUrl: string, resourceGroup: string, metricDefinition: string, resourceName: string, apiVersion: string): string;
}
