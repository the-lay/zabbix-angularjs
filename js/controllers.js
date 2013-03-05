var parser = 'http://zabbixcm02.internal.corp/zabbix/frontend/parser.php';



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
  $http.post(parser,
  {
    method: 'hostGet',
    params: {
      output: ['hostid', 'name'],
      sortfield: 'name'
    }
  }
  ).success(function (data) {
    $rootScope.servers = data;
  });
});

angular.module('SharedServices', [])
    .config(function ($httpProvider) {
        $httpProvider.responseInterceptors.push('myHttpInterceptor');
        var spinnerFunction = function (data, headersGetter) {
            // todo start the spinner here
            $('#loading').show();
            //$('<p class="abc">loading</p>').insertAfter('.loading').hide();
            // alert('start spinner');

            return data;
        };
        $httpProvider.defaults.transformRequest.push(spinnerFunction);
    })
// register the interceptor as a service, intercepts ALL angular ajax http calls
    .factory('myHttpInterceptor', function ($q, $window) {
        return function (promise) {
            return promise.then(function (response) {
                // do something on success
                // todo hide the spinner
                $('#loading').hide();
                // alert('stop spinner');
                return response;

            }, function (response) {
                // do something on error
                // todo hide the spinner
                $('#loading').hide();
                // alert('stop spinner');
                return $q.reject(response);
            });
        };
    });


function menuController($scope, $location) {
  $scope.findServer = function() {
    $location.path('/search/' + $scope.searchQuery);
    $scope.searchQuery="";
  };
}

function overviewController($scope, $http) {
  $http.post(parser,
    {
      method: 'hostgroupGet',
      params: {
        output: ['groupid', 'name'],
        sortfield: 'name',
        real_hosts: true
      }
    }
  ).success(function (data, $timeout) {

    $http.post(parser,
    {
      method: 'triggerGet',
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

      for(var a=0; a<data.length; a++) {
        data[a].errors = 0;
      }

      for (var i=0; i<trigger_data.length; i++) {
        // console.log(trigger_data[i]);
        for (var j=0; j<trigger_data[i].groups.length; j++) {
          // console.log(trigger_data[i].groups[j].groupid);
          for (var k=0; k<data.length; k++) {
            if (data[k].groupid == trigger_data[i].groups[j].groupid) {
              data[k].errors += 1;
            }
          }
        }
      }

      $scope.server_groups = data;

    });
  });
}

function serversController($scope, $http, $routeParams) {
  $http.post(parser,
  {
    method: 'hostGet',
    params: {
      //selectTriggers: ['only_true'],
      monitored_hosts: true,
      output: ['name', 'available', 'hostid'] //todo
    }
  }).success(function (data) {
    $scope.hostsData = data;
  });
  $('#filterInput').focus();
}

function serversDetailsController($scope, $http, $routeParams) {

  $http.post(parser,
  {
    method: 'hostGet',
    params: {
      hostids: $routeParams.serverId,
      //selectTriggers: 'extend',
      selectGraphs: ['graphid']
    }
  }).success(function (data) {
    $scope.hostData = data;
    $scope.noOfPages = data[0].graphs.length;
    $scope.currentPage = 1;
    $scope.currentZoom = 3600;
    $scope.zoom = 3600;
  });
  //$scope.imageUrl = 'http://zabbixcm02.internal.corp/zabbix/chart2.php?graphid='+$scope.hostData[0].graphs[$scope.currentPage-1].graphid+'&width=800&height=100&period='+$scope.currentZoom;
  $scope.setZoom = function (zoom) {
    $scope.currentZoom = zoom;
  };

  $scope.setPage = function (pageNo) {
    $scope.currentPage = pageNo;
  };
}

function projectController($scope, $http, $routeParams, $location) {

  if (!$routeParams.projectId) {
    $location.path('/');
  }
  //shows all servers monitored in one hostgroup/project
  $http.post(parser,
      {
        method: 'hostgroupGet',
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
        scope.$apply(function() { $location.path("/"); });
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

function searchController($scope, $http, $routeParams, $location) {
  $scope.searchPhrase = $routeParams.searchString;
  if (!$routeParams.searchString) {
    $location.path('/');
  }
  $("#serverSearch").blur();
  $http.post(parser,
    {
      method: 'hostGet',
      params: {
        monitored_hosts: true,
        output: ['name', 'hostid'],
        search: {name: $routeParams.searchString},
        sortfield: 'name'
      }
    }).success(function (data) {
      $scope.hostsData = data;
    });

  $http.post(parser,
    {
      method: 'hostgroupGet',
      params: {
        output: ['groupid', 'name'],
        sortfield: 'name',
        real_hosts: true,
        search: {name: $routeParams.searchString}
      }
    }).success(function (data) {
      $scope.groupsData = data;
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
