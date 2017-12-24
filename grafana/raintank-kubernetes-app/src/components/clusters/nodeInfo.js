import moment from 'moment';

export class NodeInfoCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.datasourceSrv = datasourceSrv;
    this.$location = $location;
    document.title = 'Grafana Kubernetes App';

    this.pageReady = false;
    this.cluster = {};
    this.clusterDS = {};
    this.node = {};

    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      let cluster_id = $location.search().cluster;
      let node_name  = $location.search().node;

      this.loadDatasource(cluster_id).then(() => {
        this.clusterDS.getNode(node_name).then(node => {
          this.node = node;
          this.pageReady = true;
        });
      });
    }
  }

  loadDatasource(id) {
    return this.backendSrv.get('api/datasources/' + id)
      .then(ds => {
        this.cluster = ds;
        return this.datasourceSrv.get(ds.name);
      }).then(clusterDS => {
        this.clusterDS = clusterDS;
        return clusterDS;
      });
  }

  goToNodeDashboard() {
    this.$location.path("dashboard/db/kubernetes-node")
      .search({
        "var-datasource": this.cluster.jsonData.ds,
        "var-cluster": this.cluster.name,
        "var-node": slugify(this.node.metadata.name)
      });
  }

  conditionStatus(condition) {
    var status;
    if (condition.type === "Ready") {
      status = condition.status === "True";
    } else {
      status = condition.status === "False";
    }

    return {
      value: status,
      text: status ? "Ok" : "Error"
    };
  }

  isConditionOk(condition) {
    return this.conditionStatus(condition).value;
  }

  conditionLastTransitionTime(condition) {
    return moment(condition.lastTransitionTime).format('YYYY-MM-DD HH:mm:ss');
  }
}

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(/[.]/g, "_").replace("/\W+/", "");
  return slug;
}

NodeInfoCtrl.templateUrl = 'components/clusters/partials/node_info.html';
