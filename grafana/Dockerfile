FROM gcr.io/google_containers/heapster-grafana-amd64:v4.4.3

RUN grafana-cli plugins install grafana-azure-monitor-datasource && \
    grafana-cli plugins install raintank-kubernetes-app
