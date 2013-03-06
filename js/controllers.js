var api_url = 'http://zabbixcm02.internal.corp/zabbix/api_jsonrpc.php';

var app = angular.module('zabbix', ['ui.bootstrap', 'SharedServices'])
  .config(function($routeProvider, $locationProvider) {

//Routing
  $routeProvider.
  //Home aka. Overview
    when('/', {controller: overviewController,
      templateUrl: 'views/overview.html', title_prefix: 'Home'}).

  //List of all servers
    when('/servers', {controller: serversController,
      templateUrl: 'views/servers.html', title_prefix: 'Servers'}).

  //Data about one server
    when('/servers/:serverId', {controller: serversDetailsController,
      templateUrl: 'views/serverDetails.html', title_prefix: 'Server'}).

  //Data about one project
    when('/project/:projectId', {controller: projectController,
      templateUrl: 'views/project.html', title_prefix: 'Project'}).

  //TV Mode
    when('/tv', {controller: tvController,
      templateUrl: 'views/tv.html', title_prefix: 'TV Mode'}).

  //Search
    when('/search/:searchString', {controller: searchController,
      templateUrl: 'views/search.html', title_prefix: 'Search'}).

  //Login
    when('/login', {controller: loginController,
      templateUrl: 'views/login.html', title_prefix: 'Login'}).

  //Everything else is 404
    otherwise({redirectTo: '/'});

//Enabling deep linking
  $locationProvider.
    html5Mode(false);

});

app.run(function($rootScope, $route, $http, $location) {

  $rootScope.page_title = 'Home - Zabbix';

  //Title and active menu changing
  $rootScope.activePath = null;
  $rootScope.$on('$routeChangeSuccess', function() {
    if ($route.current.$route.title_prefix) {
      $rootScope.page_title = $route.current.$route.title_prefix + " - Zabbix";
    } else {
      $rootScope.page_title = "Zabbix";
    }
    $rootScope.activePath = $location.path();
  });

  //One time fetching of servers available, for autocomplete in search
  $http.post(api_url,
  {
    jsonrpc: "2.0",
    id: $rootScope.auth_id,
    auth: $rootScope.auth,
    method: 'host.get',
    params: {
      output: ['name'],
      sortfield: 'name'
    }
  }
  ).success(function (data) {
    $rootScope.serversOnline = data.result;
  });
});

angular.module('SharedServices', [])
  .config(function ($httpProvider) {
    $httpProvider.responseInterceptors.push('myHttpInterceptor');
    var spinnerFunction = function (data, headersGetter) {
      $('#loading').show();
      return data;
    };
    $httpProvider.defaults.transformRequest.push(spinnerFunction);
  })
  .factory('myHttpInterceptor', function ($q, $window) {
      return function (promise) {
          return promise.then(function (response) {
              $('#loading').hide();
              return response;

          }, function (response) {
              $('#loading').hide();
              return $q.reject(response);
          });
      };
  });

function loginController($scope, $http, $rootScope, $location) {
  $('#inputName').focus();

  $scope.login = function() {
    $rootScope.auth_id = Date.now();

    $http.post(api_url, {
      "jsonrpc": "2.0",
      "method": "user.login",
      auth: $rootScope.auth,
      "params": {
          "user": $scope.inputName,
          "password": $scope.inputPassword
      },
      "id": $rootScope.auth_id
    }).success(function (data) {
      if (data.error) {
        $scope.error = data.error;
      } else {
        $scope.error = null;
        $rootScope.auth = data.result;
        $location.path('/');
      }
    });
  };
}

function menuController($scope, $location, $rootScope) {
  $scope.findServer = function() {
    if ($scope.searchQuery )
    $location.path('/search/' + $scope.searchQuery);
    $scope.searchQuery="";
  };
}

function overviewController($rootScope, $scope, $http) {
  $http.post(api_url,
    {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'hostgroup.get',
      params: {
        output: ['groupid', 'name'],
        sortfield: 'name',
        real_hosts: true
      }
    }
  ).success(function (data, $timeout) {

    $http.post(api_url,
    {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'trigger.get',
      params: {
        selectGroups: 'refer',
        only_true: true,
        filter: {
          "value": 1
        },
        skipDependent: true,
        monitored: true,
        min_severity: 3
      }
    }).success(function (trigger_data) {
      //TODO
      for(var a=0; a<data.result.length; a++) {
        data.result[a].errors = 0;
      }

      for (var i=0; i<trigger_data.result.length; i++) {
        for (var j=0; j<trigger_data.result[i].groups.length; j++) {
          for (var k=0; k<data.result.length; k++) {
            if (data.result[k].groupid == trigger_data.result[i].groups[j].groupid) {
              data.result[k].errors += 1;
            }
          }
        }
      }
      //console.log(data);

      $scope.server_groups = data.result;

    });
  });
}

function serversController($rootScope, $scope, $http, $routeParams) {
  $http.post(api_url,
  {
    jsonrpc: "2.0",
    id: $rootScope.auth_id,
    auth: $rootScope.auth,
    method: 'host.get',
    params: {
      //selectTriggers: ['only_true'],
      monitored_hosts: true,
      output: ['name', 'available', 'hostid'] //todo
    }
  }).success(function (data) {
    $scope.hostsData = data.result;
  });
  $('#filterInput').focus();
}

function serversDetailsController($rootScope, $scope, $http, $routeParams) {

  $http.post(api_url,
  {
    jsonrpc: "2.0",
    id: $rootScope.auth_id,
    auth: $rootScope.auth,
    method: 'host.get',
    params: {
      hostids: $routeParams.serverId,
      //selectTriggers: 'extend',
      selectGraphs: ['graphid']
    }
  }).success(function (data) {
    $scope.hostData = data.result;
    $scope.noOfPages = data.result[0].graphs.length;
    $scope.currentPage = 1;
    $scope.currentZoom = 3600;
    $scope.zoom = 3600;
    console.log(data);
  });
  //$scope.imageUrl = 'http://zabbixcm02.internal.corp/zabbix/chart2.php?graphid='+$scope.hostData[0].graphs[$scope.currentPage-1].graphid+'&width=800&height=100&period='+$scope.currentZoom;
  $scope.setZoom = function (zoom) {
    $scope.currentZoom = zoom;
  };

  $scope.setPage = function (pageNo) {
    $scope.currentPage = pageNo;
  };
}

function projectController($rootScope, $scope, $http, $routeParams, $location) {

  if (!$routeParams.projectId) {
    $location.path('/');
  }
  //shows all servers monitored in one hostgroup/project
  $http.post(api_url,
      {
        jsonrpc: "2.0",
        id: $rootScope.auth_id,
        method: 'hostgroup.get',
        auth: $rootScope.auth,
        params: {
          groupids: $routeParams.projectId,
          output: ['groupid','name'],
          sortfield: 'name',
          selectHosts: ['hostid', 'available', 'host'],
          real_hosts: true,
          monitored_hosts: true
        }
      }
    ).success(function (data, $timeout, $location) {
      if (data.length) {
        $scope.hostgroupData = data[0];
      } else {
        $location.path("/");
      }
    });
}

function dataController($scope) {

}

function tvController($scope) {

}

function adminController($scope) {

}

function notFoundController($scope) {

}

function searchController($rootScope, $scope, $http, $routeParams, $location) {
  $scope.searchPhrase = $routeParams.searchString;
  if (!$routeParams.searchString) {
    $location.path('/');
  }
  $("#serverSearch").blur();
  $http.post(api_url,
    {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      method: 'host.get',
      auth: $rootScope.auth,
      params: {
        monitored_hosts: true,
        output: ['name', 'hostid'],
        search: {name: $routeParams.searchString},
        sortfield: 'name'
      }
    }).success(function (data) {
      $scope.hostsData = data.result;
    });

  $http.post(api_url,
    {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      method: 'hostgroup.get',
      auth: $rootScope.auth,
      params: {
        output: ['groupid', 'name'],
        sortfield: 'name',
        real_hosts: true,
        search: {name: $routeParams.searchString}
      }
    }).success(function (data) {
      $scope.groupsData = data.result;
    });


}

// Deprecated for now //
//
// function alertController($scope) {
//   // $scope.alerts = [
//   //   { type: 'error', msg: 'Oh snap! Change a few things up and try submitting again.' },
//   //   { type: 'success', msg: 'Well done! You successfully read this important alert message.' }
//   // ];
//   // $scope.closeAlert = function(index) {
//   //   $scope.alerts.splice(index, 1);
//   // };
//   // $scope.addAlert = function() {
//   //   $scope.alerts.push({msg: "Another alert!", type: 'warning'});
//   // };
// };
