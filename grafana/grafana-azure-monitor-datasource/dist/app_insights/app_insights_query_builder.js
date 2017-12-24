///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['lodash', './app_insights_querystring_builder', './response_parser'], function(exports_1) {
    var lodash_1, app_insights_querystring_builder_1, response_parser_1;
    var AppInsightsQueryBuilder;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (app_insights_querystring_builder_1_1) {
                app_insights_querystring_builder_1 = app_insights_querystring_builder_1_1;
            },
            function (response_parser_1_1) {
                response_parser_1 = response_parser_1_1;
            }],
        execute: function() {
            AppInsightsQueryBuilder = (function () {
                function AppInsightsQueryBuilder(instanceSettings, backendSrv, templateSrv, $q) {
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.$q = $q;
                    this.version = 'beta';
                    this.id = instanceSettings.id;
                    this.applicationId = instanceSettings.jsonData.appInsightsAppId;
                    this.baseUrl = "/appinsights/" + this.version + "/apps/" + this.applicationId + "/metrics";
                    this.url = instanceSettings.url;
                }
                AppInsightsQueryBuilder.prototype.isConfigured = function () {
                    return this.applicationId && this.applicationId.length > 0;
                };
                AppInsightsQueryBuilder.prototype.query = function (options) {
                    var _this = this;
                    var queries = lodash_1.default.filter(options.targets, function (item) {
                        return item.hide !== true;
                    }).map(function (target) {
                        var item = target.appInsights;
                        var querystringBuilder = new app_insights_querystring_builder_1.default(options.range.from, options.range.to, options.interval);
                        if (item.groupBy !== 'none') {
                            querystringBuilder.setGroupBy(item.groupBy);
                        }
                        querystringBuilder.setAggregation(item.aggregation);
                        querystringBuilder.setInterval(item.timeGrainType, _this.templateSrv.replace(item.timeGrain, options.scopedVars), item.timeGrainUnit);
                        var url = _this.baseUrl + "/" + _this.templateSrv.replace(item.metricName, options.scopedVars) + "?" + querystringBuilder.generate();
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
                AppInsightsQueryBuilder.prototype.doQueries = function (queries) {
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
                AppInsightsQueryBuilder.prototype.annotationQuery = function (options) {
                };
                AppInsightsQueryBuilder.prototype.metricFindQuery = function (query) {
                };
                AppInsightsQueryBuilder.prototype.testDatasource = function () {
                    var url = this.baseUrl + "/metadata";
                    return this.doRequest(url).then(function (response) {
                        if (response.status === 200) {
                            return {
                                status: 'success',
                                message: 'Successfully queried the Application Insights service.',
                                title: 'Success'
                            };
                        }
                    }).catch(function (error) {
                        var message = 'Application Insights: ';
                        message += error.statusText ? error.statusText + ': ' : '';
                        if (error.data && error.data.error && error.data.error.code === 'PathNotFoundError') {
                            message += 'Invalid Application Id for Application Insights service.';
                        }
                        else if (error.data && error.data.error) {
                            message += error.data.error.code + '. ' + error.data.error.message;
                        }
                        else {
                            message += 'Cannot connect to Application Insights REST API.';
                        }
                        return {
                            status: 'error',
                            message: message
                        };
                    });
                };
                AppInsightsQueryBuilder.prototype.doRequest = function (url, maxRetries) {
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
                AppInsightsQueryBuilder.prototype.getMetricNames = function () {
                    var url = this.baseUrl + "/metadata";
                    return this.doRequest(url).then(response_parser_1.default.parseMetricNames);
                };
                AppInsightsQueryBuilder.prototype.getMetricMetadata = function (metricName) {
                    var url = this.baseUrl + "/metadata";
                    return this.doRequest(url).then(function (result) {
                        return response_parser_1.default.parseMetadata(result, metricName);
                    });
                };
                return AppInsightsQueryBuilder;
            })();
            exports_1("default", AppInsightsQueryBuilder);
        }
    }
});
//# sourceMappingURL=app_insights_query_builder.js.map