///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import AzureMonitorFilterBuilder from './azure_monitor_filter_builder';
import UrlBuilder from './url_builder';
import ResponseParser from './response_parser';

export default class AzureMonitorQueryBuilder {
  apiVersion = '2017-05-01-preview';
  id: number;
  subscriptionId: string;
  baseUrl: string;
  resourceGroup: string;
  resourceName: string;
  url: string;
  defaultDropdownValue = 'select';
  supportedMetricNamespaces = [
    'Microsoft.Compute',
    'Microsoft.ClassicCompute',
    'Microsoft.Storage',
    'Microsoft.Sql',
    'Microsoft.Web',
    'Microsoft.EventHub',
    'Microsoft.ServiceBus',
    'Microsoft.Devices',
    'Microsoft.DocumentDb',
    'Microsoft.Network',
    'Microsoft.Cache/Redis',
    'Microsoft.AnalysisServices/servers',
    'Microsoft.ApiManagement/service',
    'Microsoft.Automation/automationAccounts',
    'Microsoft.Batch/batchAccounts',
    'Microsoft.CognitiveServices/accounts',
    'Microsoft.CustomerInsights/hubs',
    'Microsoft.DataLakeAnalytics/accounts',
    'Microsoft.DataLakeStore/accounts',
    'Microsoft.DBforMySQL/servers',
    'Microsoft.DBforPostgreSQL/servers',
    'Microsoft.Logic/workflows',
    'Microsoft.NotificationHubs/Namespaces/NotificationHubs',
    'Microsoft.Search/searchServices',
    'Microsoft.StreamAnalytics/streamingjobs'
  ];

  constructor(private instanceSettings, private backendSrv, private templateSrv, private $q) {
    this.id = instanceSettings.id;
    this.subscriptionId = instanceSettings.jsonData.subscriptionId;
    this.baseUrl = `/azuremonitor/subscriptions/${this.subscriptionId}/resourceGroups`;
    this.url = instanceSettings.url;
  }

  isConfigured() {
    return this.subscriptionId && this.subscriptionId.length > 0;
  }

  query(options) {
    const queries = _.filter(options.targets, item => {
      return item.hide !== true
        && item.azureMonitor.resourceGroup && item.azureMonitor.resourceGroup !== this.defaultDropdownValue
        && item.azureMonitor.resourceName && item.azureMonitor.resourceName !== this.defaultDropdownValue
        && item.azureMonitor.metricDefinition && item.azureMonitor.metricDefinition !== this.defaultDropdownValue
        && item.azureMonitor.metricName && item.azureMonitor.metricName !== this.defaultDropdownValue;
    }).map(target => {
      const item = target.azureMonitor;
      const resourceGroup = this.templateSrv.replace(item.resourceGroup, options.scopedVars);
      const resourceName = this.templateSrv.replace(item.resourceName, options.scopedVars);
      const metricDefinition = this.templateSrv.replace(item.metricDefinition, options.scopedVars);
      const metricName = this.templateSrv.replace(item.metricName, options.scopedVars);
      const timeGrain = this.templateSrv.replace(item.timeGrain.toString(), options.scopedVars);

      const filterBuilder = new AzureMonitorFilterBuilder(
        item.metricName,
        options.range.from,
        options.range.to,
        timeGrain,
        item.timeGrainUnit,
        options.interval
      );

      if (item.aggregation) {
        filterBuilder.setAggregation(item.aggregation);
      }

      if (item.dimension && item.dimension !== 'None') {
        filterBuilder.setDimensionFilter(item.dimension, item.dimensionFilter);
      }

      const filter = this.templateSrv.replace(filterBuilder.generateFilter(), options.scopedVars);

      const url = UrlBuilder.buildAzureMonitorQueryUrl(
        this.baseUrl,
        resourceGroup,
        metricDefinition,
        resourceName,
        this.apiVersion,
        filter
      );

      return {
        refId: target.refId,
        intervalMs: options.intervalMs,
        maxDataPoints: options.maxDataPoints,
        datasourceId: this.id,
        url: url,
        format: options.format,
        alias: item.alias
      };
    });

    if (queries.length === 0) {
      return this.$q.when({data: []});
    }

    const promises = this.doQueries(queries);

    return this.$q.all(promises).then(results => {
      return new ResponseParser(results).parseQueryResult();
    });
  }

  doQueries(queries) {
    return _.map(queries, query => {
      return this.doRequest(query.url).then(result => {
        return {
          result: result,
          query: query
        };
      });
    });
  }

  annotationQuery(options) {
  }

  metricFindQuery(query: string) {
    const url = `${this.baseUrl}${query}`;
    return this.doRequest(url).then(result => {
      return ResponseParser.parseResponseValues(result, 'name', 'name');
    });
  }

  getMetricDefinitions(resourceGroup: string) {
    const url = `${this.baseUrl}/${resourceGroup}/resources?api-version=2017-06-01`;
    return this.doRequest(url).then(result => {
      return ResponseParser.parseResponseValues(result, 'type', 'type');
    }).then(result => {
      return _.filter(result, t => {
        for (let i = 0; i < this.supportedMetricNamespaces.length; i++) {
          if (_.startsWith(t.value, this.supportedMetricNamespaces[i])) {
            return true;
          }
        }

        return false;
      });
    }).then(result => {
      let shouldHardcodeBlobStorage = false;
      for (let i = 0; i < result.length; i++){
        if (result[i].value === 'Microsoft.Storage/storageAccounts') {
          shouldHardcodeBlobStorage = true;
          break;
        }
      }

      if (shouldHardcodeBlobStorage) {
        result.push({
          text: 'Microsoft.Storage/storageAccounts/blobServices',
          value: 'Microsoft.Storage/storageAccounts/blobServices'
        });
        result.push({
          text: 'Microsoft.Storage/storageAccounts/fileServices',
          value: 'Microsoft.Storage/storageAccounts/fileServices'
        });
        result.push({
          text: 'Microsoft.Storage/storageAccounts/tableServices',
          value: 'Microsoft.Storage/storageAccounts/tableServices'
        });
        result.push({
          text: 'Microsoft.Storage/storageAccounts/queueServices',
          value: 'Microsoft.Storage/storageAccounts/queueServices'
        });
      }

      return result;
    });
  }

  getResourceNames(resourceGroup: string, metricDefinition: string) {
    const url = `${this.baseUrl}/${resourceGroup}/resources?api-version=2017-06-01`;

    return this.doRequest(url).then(result => {
      if (!_.startsWith(metricDefinition, 'Microsoft.Storage/storageAccounts/')) {
        return ResponseParser.parseResourceNames(result, metricDefinition);
      }

      const list = ResponseParser.parseResourceNames(result, 'Microsoft.Storage/storageAccounts');
      for (let i = 0; i < list.length; i++) {
        list[i].text += '/default';
        list[i].value += '/default';
      }

      return list;
    });
  }

  getMetricNames(resourceGroup: string, metricDefinition: string, resourceName: string) {
    const url = UrlBuilder.buildAzureMonitorGetMetricNamesUrl(
      this.baseUrl,
      resourceGroup,
      metricDefinition,
      resourceName,
      this.apiVersion
    );

    return this.doRequest(url).then(result => {
      return ResponseParser.parseResponseValues(result, 'name.localizedValue', 'name.value');
    });
  }

  getMetricMetadata(resourceGroup: string, metricDefinition: string, resourceName: string, metricName: string) {
    const url = UrlBuilder.buildAzureMonitorGetMetricNamesUrl(
      this.baseUrl,
      resourceGroup,
      metricDefinition,
      resourceName,
      this.apiVersion
    );

    return this.doRequest(url).then(result => {
      return ResponseParser.parseMetadata(result, metricName);
    });
  }

  testDatasource() {
    if (!this.isValidConfigField(this.instanceSettings.jsonData.tenantId)) {
      return {
        status: 'error',
        message: 'The Tenant Id field is required.'
      };
    }

    if (!this.isValidConfigField(this.instanceSettings.jsonData.clientId)) {
      return {
        status: 'error',
        message: 'The Client Id field is required.'
      };
    }

    const url = `${this.baseUrl}?api-version=2017-06-01`;
    return this.doRequest(url).then(response => {
      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Successfully queried the Azure Monitor service.',
          title: 'Success'
        };
      }
    })
    .catch(error => {
      let message = 'Azure Monitor: ';
      message += error.statusText ? error.statusText + ': ' : '';

      if (error.data && error.data.error && error.data.error.code) {
        message += error.data.error.code + '. ' + error.data.error.message;
      } else if (error.data && error.data.error) {
        message += error.data.error;
      } else if (error.data) {
        message += error.data;
      } else {
        message += 'Cannot connect to Azure Monitor REST API.';
      }
      return {
        status: 'error',
        message: message
      };
    });
  }

  isValidConfigField(field: string) {
    return field && field.length > 0;
  }

  doRequest(url, maxRetries = 1) {
    return this.backendSrv.datasourceRequest({
      url: this.url + url,
      method: 'GET'
    }).catch(error => {
      if (maxRetries > 0) {
        return this.doRequest(url, maxRetries - 1);
      }

      throw error;
    });
  }
}
