///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['lodash', './azure_monitor_filter_builder', './url_builder', './response_parser'], function(exports_1) {
    var lodash_1, azure_monitor_filter_builder_1, url_builder_1, response_parser_1;
    var AzureMonitorQueryBuilder;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (azure_monitor_filter_builder_1_1) {
                azure_monitor_filter_builder_1 = azure_monitor_filter_builder_1_1;
            },
            function (url_builder_1_1) {
                url_builder_1 = url_builder_1_1;
            },
            function (response_parser_1_1) {
                response_parser_1 = response_parser_1_1;
            }],
        execute: function() {
            AzureMonitorQueryBuilder = (function () {
                function AzureMonitorQueryBuilder(instanceSettings, backendSrv, templateSrv, $q) {
                    this.instanceSettings = instanceSettings;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.$q = $q;
                    this.apiVersion = '2017-05-01-preview';
                    this.defaultDropdownValue = 'select';
                    this.supportedMetricNamespaces = [
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
                    this.id = instanceSettings.id;
                    this.subscriptionId = instanceSettings.jsonData.subscriptionId;
                    this.baseUrl = "/azuremonitor/subscriptions/" + this.subscriptionId + "/resourceGroups";
                    this.url = instanceSettings.url;
                }
                AzureMonitorQueryBuilder.prototype.isConfigured = function () {
                    return this.subscriptionId && this.subscriptionId.length > 0;
                };
                AzureMonitorQueryBuilder.prototype.query = function (options) {
                    var _this = this;
                    var queries = lodash_1.default.filter(options.targets, function (item) {
                        return item.hide !== true
                            && item.azureMonitor.resourceGroup && item.azureMonitor.resourceGroup !== _this.defaultDropdownValue
                            && item.azureMonitor.resourceName && item.azureMonitor.resourceName !== _this.defaultDropdownValue
                            && item.azureMonitor.metricDefinition && item.azureMonitor.metricDefinition !== _this.defaultDropdownValue
                            && item.azureMonitor.metricName && item.azureMonitor.metricName !== _this.defaultDropdownValue;
                    }).map(function (target) {
                        var item = target.azureMonitor;
                        var resourceGroup = _this.templateSrv.replace(item.resourceGroup, options.scopedVars);
                        var resourceName = _this.templateSrv.replace(item.resourceName, options.scopedVars);
                        var metricDefinition = _this.templateSrv.replace(item.metricDefinition, options.scopedVars);
                        var metricName = _this.templateSrv.replace(item.metricName, options.scopedVars);
                        var timeGrain = _this.templateSrv.replace(item.timeGrain.toString(), options.scopedVars);
                        var filterBuilder = new azure_monitor_filter_builder_1.default(item.metricName, options.range.from, options.range.to, timeGrain, item.timeGrainUnit, options.interval);
                        if (item.aggregation) {
                            filterBuilder.setAggregation(item.aggregation);
                        }
                        if (item.dimension && item.dimension !== 'None') {
                            filterBuilder.setDimensionFilter(item.dimension, item.dimensionFilter);
                        }
                        var filter = _this.templateSrv.replace(filterBuilder.generateFilter(), options.scopedVars);
                        var url = url_builder_1.default.buildAzureMonitorQueryUrl(_this.baseUrl, resourceGroup, metricDefinition, resourceName, _this.apiVersion, filter);
                        return {
                            refId: target.refId,
                            intervalMs: options.intervalMs,
                            maxDataPoints: options.maxDataPoints,
                            datasourceId: _this.id,
                            url: url,
                            format: options.format,
                            alias: item.alias
                        };
                    });
                    if (queries.length === 0) {
                        return this.$q.when({ data: [] });
                    }
                    var promises = this.doQueries(queries);
                    return this.$q.all(promises).then(function (results) {
                        return new response_parser_1.default(results).parseQueryResult();
                    });
                };
                AzureMonitorQueryBuilder.prototype.doQueries = function (queries) {
                    var _this = this;
                    return lodash_1.default.map(queries, function (query) {
                        return _this.doRequest(query.url).then(function (result) {
                            return {
                                result: result,
                                query: query
                            };
                        });
                    });
                };
                AzureMonitorQueryBuilder.prototype.annotationQuery = function (options) {
                };
                AzureMonitorQueryBuilder.prototype.metricFindQuery = function (query) {
                    var url = "" + this.baseUrl + query;
                    return this.doRequest(url).then(function (result) {
                        return response_parser_1.default.parseResponseValues(result, 'name', 'name');
                    });
                };
                AzureMonitorQueryBuilder.prototype.getMetricDefinitions = function (resourceGroup) {
                    var _this = this;
                    var url = this.baseUrl + "/" + resourceGroup + "/resources?api-version=2017-06-01";
                    return this.doRequest(url).then(function (result) {
                        return response_parser_1.default.parseResponseValues(result, 'type', 'type');
                    }).then(function (result) {
                        return lodash_1.default.filter(result, function (t) {
                            for (var i = 0; i < _this.supportedMetricNamespaces.length; i++) {
                                if (lodash_1.default.startsWith(t.value, _this.supportedMetricNamespaces[i])) {
                                    return true;
                                }
                            }
                            return false;
                        });
                    }).then(function (result) {
                        var shouldHardcodeBlobStorage = false;
                        for (var i = 0; i < result.length; i++) {
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
                };
                AzureMonitorQueryBuilder.prototype.getResourceNames = function (resourceGroup, metricDefinition) {
                    var url = this.baseUrl + "/" + resourceGroup + "/resources?api-version=2017-06-01";
                    return this.doRequest(url).then(function (result) {
                        if (!lodash_1.default.startsWith(metricDefinition, 'Microsoft.Storage/storageAccounts/')) {
                            return response_parser_1.default.parseResourceNames(result, metricDefinition);
                        }
                        var list = response_parser_1.default.parseResourceNames(result, 'Microsoft.Storage/storageAccounts');
                        for (var i = 0; i < list.length; i++) {
                            list[i].text += '/default';
                            list[i].value += '/default';
                        }
                        return list;
                    });
                };
                AzureMonitorQueryBuilder.prototype.getMetricNames = function (resourceGroup, metricDefinition, resourceName) {
                    var url = url_builder_1.default.buildAzureMonitorGetMetricNamesUrl(this.baseUrl, resourceGroup, metricDefinition, resourceName, this.apiVersion);
                    return this.doRequest(url).then(function (result) {
                        return response_parser_1.default.parseResponseValues(result, 'name.localizedValue', 'name.value');
                    });
                };
                AzureMonitorQueryBuilder.prototype.getMetricMetadata = function (resourceGroup, metricDefinition, resourceName, metricName) {
                    var url = url_builder_1.default.buildAzureMonitorGetMetricNamesUrl(this.baseUrl, resourceGroup, metricDefinition, resourceName, this.apiVersion);
                    return this.doRequest(url).then(function (result) {
                        return response_parser_1.default.parseMetadata(result, metricName);
                    });
                };
                AzureMonitorQueryBuilder.prototype.testDatasource = function () {
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
                    var url = this.baseUrl + "?api-version=2017-06-01";
                    return this.doRequest(url).then(function (response) {
                        if (response.status === 200) {
                            return {
                                status: 'success',
                                message: 'Successfully queried the Azure Monitor service.',
                                title: 'Success'
                            };
                        }
                    })
                        .catch(function (error) {
                        var message = 'Azure Monitor: ';
                        message += error.statusText ? error.statusText + ': ' : '';
                        if (error.data && error.data.error && error.data.error.code) {
                            message += error.data.error.code + '. ' + error.data.error.message;
                        }
                        else if (error.data && error.data.error) {
                            message += error.data.error;
                        }
                        else if (error.data) {
                            message += error.data;
                        }
                        else {
                            message += 'Cannot connect to Azure Monitor REST API.';
                        }
                        return {
                            status: 'error',
                            message: message
                        };
                    });
                };
                AzureMonitorQueryBuilder.prototype.isValidConfigField = function (field) {
                    return field && field.length > 0;
                };
                AzureMonitorQueryBuilder.prototype.doRequest = function (url, maxRetries) {
                    var _this = this;
                    if (maxRetries === void 0) { maxRetries = 1; }
                    return this.backendSrv.datasourceRequest({
                        url: this.url + url,
                        method: 'GET'
                    }).catch(function (error) {
                        if (maxRetries > 0) {
                            return _this.doRequest(url, maxRetries - 1);
                        }
                        throw error;
                    });
                };
                return AzureMonitorQueryBuilder;
            })();
            exports_1("default", AzureMonitorQueryBuilder);
        }
    }
});
//# sourceMappingURL=azure_monitor_query_builder.js.map