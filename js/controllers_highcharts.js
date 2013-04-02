var api_url = 'http://zabbixcm02.internal.corp/zabbix/api_jsonrpc.php';

var app = angular.module('zabbix', ['LocalStorageModule', 'SharedServices'])
  .config(function($routeProvider, $locationProvider) {

  //Routing
  $routeProvider.
  //Home aka. Overview
  when('/', {
    controller: overviewController,
    templateUrl: 'views/overview.html',
    title_prefix: 'Home'
  }).

  //List of all servers
  when('/servers', {
    controller: serversController,
    templateUrl: 'views/servers.html',
    title_prefix: 'Servers'
  }).

  //Data about one server
  when('/servers/:serverId', {
    controller: serversDetailsController,
    templateUrl: 'views/serverDetails.html',
    title_prefix: 'Server'
  }).

  //Data about one project
  when('/project/:projectId', {
    controller: projectController,
    templateUrl: 'views/project.html',
    title_prefix: 'Project'
  }).

  //TV Mode
  when('/tv', {
    controller: tvController,
    templateUrl: 'views/tv.html',
    title_prefix: 'TV Mode'
  }).

  //Search
  when('/search/:searchString', {
    controller: searchController,
    templateUrl: 'views/search.html',
    title_prefix: 'Search'
  }).

  //Not logged in
  when('/login').

  //Logout
  when('/logout', {
    controller: logoutController,
    title_prefix: 'Logout',
    templateUrl: 'views/logout.html'
  }).

  //Everything else is 404
  otherwise({
    redirectTo: '/'
  });

  //Enabling deep linking
  $locationProvider.
  html5Mode(false);

});

app.run(function($rootScope, $route, $http, $location, localStorageService) {

  // localStorageService.clearAll();

  if (!$rootScope.loggedIn && localStorageService.get('auth')) {
    $rootScope.auth = localStorageService.get('auth');
    $rootScope.auth_id = localStorageService.get('auth_id');
    $rootScope.loggedIn = true;

    $http.post(api_url, {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'host.get',
      params: {
        output: ['name'],
        sortfield: 'name'
      }
    }).success(function(data) {
      $rootScope.serversOnline = data.result;
    });
  }

  $rootScope.page_title = 'Home - Zabbix';

  //Title and active menu changing
  $rootScope.activePath = null;
  $rootScope.$on('$routeChangeSuccess', function() {

    if (!$rootScope.loggedIn) {
      //TODO return to REFERER $rootScope.returnUrl = $location.path();
      $location.path('/login');
    }

    if ($route.current.$route.title_prefix) {
      $rootScope.page_title = $route.current.$route.title_prefix + " - Zabbix";
    } else {
      $rootScope.page_title = "Zabbix";
    }
    $rootScope.activePath = $location.path();
  });

  //TODO check cookie, log in if current
});

angular.module('SharedServices', [])
  .config(function($httpProvider) {
  $httpProvider.responseInterceptors.push('myHttpInterceptor');
  var spinnerFunction = function(data, headersGetter) {
    $('#loading').show();
    return data;
  };
  $httpProvider.defaults.transformRequest.push(spinnerFunction);
})
  .factory('myHttpInterceptor', function($q, $window) {
  return function(promise) {
    return promise.then(function(response) {
      $('#loading').hide();
      return response;

    }, function(response) {
      $('#loading').hide();
      return $q.reject(response);
    });
  };
});

function loginController($scope, $http, $rootScope, $location, localStorageService) {
  $('#inputName').focus();

  $scope.login = function() {
    $rootScope.auth_id = Date.now();
    localStorageService.add('auth_id', $rootScope.auth_id);

    $http.post(api_url, {
      "jsonrpc": "2.0",
      "method": "user.login",
      auth: $rootScope.auth,
      "params": {
        "user": $scope.inputName,
        "password": $scope.inputPassword
      },
      "id": $rootScope.auth_id
    }).success(function(data) {
      if (data.error) {
        $scope.error = data.error;
        $('#inputName').focus();
      } else {
        localStorageService.add('auth', data.result);

        $scope.error = null;
        $rootScope.auth = data.result;
        $rootScope.loggedIn = true;

        $http.post(api_url, {
          jsonrpc: "2.0",
          id: $rootScope.auth_id,
          auth: $rootScope.auth,
          method: 'host.get',
          params: {
            output: ['name'],
            sortfield: 'name'
          }
        }).success(function(data) {
          $rootScope.serversOnline = data.result;
          $location.path('/');
        });

      }
    });
  };
}

function logoutController(localStorageService, $rootScope, $http, $location) {

  if (!$rootScope.loggedIn) {
    $location.path('/login');
  } else {
    $http.post(api_url, {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'user.logout',
      params: {}
    }).success(function(data) {
      $rootScope.loggedIn = false;
      localStorageService.clearAll();
      localStorageService.cookie.clearAll();
      $rootScope.auth = null;
      $rootScope.auth_id = null;
      $location.path('/login');
    });
  }
}

function menuController($scope, $location, $rootScope) {
  $scope.findServer = function() {
    if ($scope.searchQuery) $location.path('/search/' + $scope.searchQuery);
    $scope.searchQuery = "";
  };
}

function overviewController($rootScope, $scope, $http) {
  if ($rootScope.loggedIn) {
    $http.post(api_url, {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'hostgroup.get',
      params: {
        output: ['groupid', 'name'],
        sortfield: 'name',
        real_hosts: true
      }
    }).success(function(data, $timeout) {

      $http.post(api_url, {
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
      }).success(function(trigger_data) {
        //TODO
        for (var a = 0; a < data.result.length; a++) {
          data.result[a].errors = 0;
        }

        for (var i = 0; i < trigger_data.result.length; i++) {
          for (var j = 0; j < trigger_data.result[i].groups.length; j++) {
            for (var k = 0; k < data.result.length; k++) {
              if (data.result[k].groupid == trigger_data.result[i].groups[j].groupid) {
                data.result[k].errors += 1;
              }
            }
          }
        }

        $scope.server_groups = data.result;

      });
    });
  }
}

function serversController($rootScope, $scope, $http, $routeParams) {
  if ($rootScope.loggedIn) {
    $http.post(api_url, {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'host.get',
      params: {
        //selectTriggers: ['only_true'],
        monitored_hosts: true,
        output: ['name', 'available', 'hostid'] //todo
      }
    }).success(function(data) {
      $scope.hostsData = data.result;
    });
  }
  $('#filterInput').focus();
}

function serversDetailsController($rootScope, $scope, $http, $routeParams) {
  //TODO

  if ($rootScope.loggedIn) {

//*MASTER CHART*//
  
    var currentZoom;

    var master_chart = new Highcharts.Chart({
      chart: {
        renderTo: 'masterTimeline',
        reflow: true,
        borderWidth: 0,
        backgroundColor: null,
        marginLeft: 0,
        marginRight: 20,
        zoomType: 'x',
        events: {

          // listen to the selection event on the master chart to update the
          // extremes of the detail chart
          selection: function(event) {
            var extremesObject = event.xAxis[0],
              min = extremesObject.min,
              max = extremesObject.max,
              //detailData = [],
              xAxis = this.xAxis[0];

            // reverse engineer the last part of the data
            // jQuery.each(this.series[0].data, function(i, point) {
            //   if (point.x > min && point.x < max) {
            //     detailData.push({
            //       x: point.x,
            //       y: point.y
            //     });
            //   }
            // });

            // move the plot bands to reflect the new detail span
            // xAxis.removePlotBand('mask-before');
            // xAxis.addPlotBand({
            //   id: 'mask-before',
            //   from: Date.UTC(2006, 0, 1),
            //   to: min,
            //   color: 'rgba(0, 0, 0, 0.2)'
            // });

            // xAxis.removePlotBand('mask-after');
            // xAxis.addPlotBand({
            //   id: 'mask-after',
            //   from: max,
            //   to: new Date(),
            //   color: 'rgba(0, 0, 0, 0.2)'
            // });

            return false;
          }
        }
      },
      title: {
        text: null
      },
      xAxis: {
        type: 'datetime',
        showLastTickLabel: true,
        maxZoom: 14 * 24 * 3600000, // fourteen days
        // plotBands: [{
        //   id: 'mask-before',
        //   from: 0,
        //   // from: Date.UTC(2006, 0, 1),
        //   to: Date.UTC(2008, 7, 1),
        //   color: 'rgba(0, 0, 0, 0.2)'
        // }],
        title: {
          text: null
        }
      },
      // yAxis: {
      //   gridLineWidth: 0,
      //   labels: {
      //     enabled: false
      //   },
      //   title: {
      //     text: null
      //   },
      //   min: 0.6,
      //   showFirstLabel: false
      // },
      tooltip: {
        formatter: function() {
          return false;
        }
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          fillColor: {
            linearGradient: [0, 0, 0, 70],
            stops: [
              [0, '#4572A7'],
              [1, 'rgba(0,0,0,0)']
            ]
          },
          lineWidth: 1,
          marker: {
            enabled: false
          },
          animate: false,
          shadow: false,
          states: {
            hover: {
              lineWidth: 1
            }
          },
          enableMouseTracking: false
        }
      },

        series: [{
            data: [
                [Date.UTC(2010, 0, 1), 29.9],
                [Date.UTC(2010, 0, 2), 71.5],
                [Date.UTC(2010, 0, 3), 106.4],
                [Date.UTC(2010, 0, 6), 129.2],
                [Date.UTC(2010, 0, 7), 144.0],
                [Date.UTC(2010, 0, 8), 176.0]
             ]
        }]
    });

//*Getting all items of the current server*//

    var serverItems = {};
    $http.post(api_url, {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      method: 'item.get',
      auth: $rootScope.auth,
      params: {
        hostids: $routeParams.serverId,
        monitored: true,
        sortfield: 'name',
        output: ['itemid', 'name', 'key_']
      }
    }).success(function (result) {
      serverItems = result;
    });

    if (serverItems) {
      //*CPU History*//
      $http.post(api_url,
      {
        jsonrpc: "2.0",
        id: $rootScope.auth_id,
        method: 'history.get',
        auth: $rootScope.auth,
        params: {
          hostids: $routeParams.serverId
        }
      }).success(function (data) {

      });
    }

    // $http.post(api_url, {

    // }).success(function (data) {

    // });

// //*CPU*//
//     $http.post(api_url, {
//       jsonrpc: "2.0",
//       id: $rootScope.auth_id,
//       method: 'item.get',
//       params: {
//         output: ['key_', 'name', 'itemid', 'units'],
//         hostids: $routeParams.serverId,
//         monitored: true,
//         search: {
//           'key_': 'system.cpu.util'
//         },
//         sortfield: 'name'
//       },
//       auth: $rootScope.auth
//     }).success(function(data) {
//       //get CPU history, it it's callback make graph
//     });

// //*LOAD*//
//     $http.post(api_url, {
//       jsonrpc: "2.0",
//       id: $rootScope.auth_id,
//       method: 'item.get',
//       params: {
//         output: ['key_', 'name', 'itemid', 'units'],
//         hostids: $routeParams.serverId,
//         monitored: true,
//         search: {
//           'key_': 'system.cpu.util'
//         },
//         sortfield: 'name'
//       },
//       auth: $rootScope.auth
//     }).success(function(data) {
//       //get CPU history, it it's callback make graph
//     });

// //*RAM*//
//     $http.post(api_url, {
//       jsonrpc: "2.0",
//       id: $rootScope.auth_id,
//       method: 'item.get',
//       params: {
//         output: ['key_', 'name', 'itemid', 'units'],
//         hostids: $routeParams.serverId,
//         monitored: true,
//         search: {
//           'key_': 'system.cpu.util'
//         },
//         sortfield: 'name'
//       },
//       auth: $rootScope.auth
//     }).success(function(data) {
//       //get CPU history, it it's callback make graph
//     });

// //*DiskIO*//
//     $http.post(api_url, {
//       jsonrpc: "2.0",
//       id: $rootScope.auth_id,
//       method: 'item.get',
//       params: {
//         output: ['key_', 'name', 'itemid', 'units'],
//         hostids: $routeParams.serverId,
//         monitored: true,
//         search: {
//           'key_': 'system.cpu.util'
//         },
//         sortfield: 'name'
//       },
//       auth: $rootScope.auth
//     }).success(function(data) {
//       //get CPU history, it it's callback make graph
//     });

// //*NetworkIO*//
//     $http.post(api_url, {
//       jsonrpc: "2.0",
//       id: $rootScope.auth_id,
//       method: 'item.get',
//       params: {
//         output: ['key_', 'name', 'itemid', 'units'],
//         hostids: $routeParams.serverId,
//         monitored: true,
//         search: {
//           'key_': 'system.cpu.util'
//         },
//         sortfield: 'name'
//       },
//       auth: $rootScope.auth
//     }).success(function(data) {
//       //get CPU history, it it's callback make graph
//     });

// //*General Data*//
//     $http.post(api_url, {
//       jsonrpc: "2.0",
//       id: $rootScope.auth_id,
//       method: 'item.get',
//       params: {
//         output: ['key_', 'name', 'itemid', 'units'],
//         hostids: $routeParams.serverId,
//         monitored: true,
//         search: {
//           'key_': 'system.cpu.util'
//         },
//         sortfield: 'name'
//       },
//       auth: $rootScope.auth
//     }).success(function(data) {
//       //get CPU history, it it's callback make graph
//     });


    //redo UI, add all graphs on one page, make views for all servers unified
    // $http.post(api_url,
    // {
    //   jsonrpc: "2.0",
    //   id: $rootScope.auth_id,
    //   auth: $rootScope.auth,
    //   method: 'host.get',
    //   params: {
    //     hostids: $routeParams.serverId,
    //     //selectTriggers: 'extend',
    //     selectGraphs: ['graphid']
    //   }
    // }).success(function (data) {
    //   $scope.hostData = data.result;
    //   $scope.noOfPages = data.result[0].graphs.length;
    //   $scope.currentPage = 1;
    //   $scope.currentZoom = 3600;
    //   $scope.zoom = 3600;
    //   console.log(data);
    // });

    // //$scope.imageUrl = 'http://zabbixcm02.internal.corp/zabbix/chart2.php?graphid='+$scope.hostData[0].graphs[$scope.currentPage-1].graphid+'&width=800&height=100&period='+$scope.currentZoom;
    // $scope.setZoom = function (zoom) {
    //   $scope.currentZoom = zoom;
    // };

    // $scope.setPage = function (pageNo) {
    //   $scope.currentPage = pageNo;
    // };
  }
}

function projectController($rootScope, $scope, $http, $routeParams, $location) {

  if (!$routeParams.projectId) {
    $location.path('/');
  }
  //shows all servers monitored in one hostgroup/project
  if ($rootScope.loggedIn) {
    $http.post(api_url, {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      method: 'hostgroup.get',
      auth: $rootScope.auth,
      params: {
        groupids: $routeParams.projectId,
        output: ['groupid', 'name'],
        sortfield: 'name',
        selectHosts: ['hostid', 'available', 'host'],
        real_hosts: true,
        monitored_hosts: true
      }
    }).success(function(data, $timeout, $location) {
      $scope.hostgroupData = data.result[0];
    });
  }
}


function tvController($scope) {

}

function searchController($rootScope, $scope, $http, $routeParams, $location) {
  $scope.searchPhrase = $routeParams.searchString;
  if (!$routeParams.searchString) {
    $location.path('/');
  }
  $("#serverSearch").blur();

  if ($rootScope.loggedIn) {
    $http.post(api_url, {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      method: 'host.get',
      auth: $rootScope.auth,
      params: {
        monitored_hosts: true,
        output: ['name', 'hostid'],
        search: {
          name: $routeParams.searchString
        },
        sortfield: 'name'
      }
    }).success(function(data) {
      $scope.hostsData = data.result;
    });

    $http.post(api_url, {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      method: 'hostgroup.get',
      auth: $rootScope.auth,
      params: {
        output: ['groupid', 'name'],
        sortfield: 'name',
        real_hosts: true,
        search: {
          name: $routeParams.searchString
        }
      }
    }).success(function(data) {
      $scope.groupsData = data.result;
    });
  }

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