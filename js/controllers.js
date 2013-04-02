//Zabbix API URL
var api_url = 'http://zabbixcm02.internal.corp/zabbix/api_jsonrpc.php';

//useful functions used
function timeConverter(UNIX_timestamp){
 var a = new Date(UNIX_timestamp*1000);
 var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
     var year = a.getFullYear();
     var month = months[a.getMonth()];
     var date = a.getDate();
     var hour = a.getHours();
     var min = a.getMinutes();
     var sec = a.getSeconds();
     var time = date+' '+month+' '+year+', '+hour+':'+min+':'+sec ;
     return time;
 }

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
    title_prefix: 'TV Dashboard'
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

app.run(function ($rootScope, $route, $http, $location, localStorageService) {

  //checking if user was logged in before
  if (!$rootScope.loggedIn && localStorageService.get('auth')) {
    //restoring session
    $rootScope.auth = localStorageService.get('auth');
    $rootScope.auth_id = localStorageService.get('auth_id');
    $rootScope.loggedIn = true;

    //getting list of monitored servers for autocompletion in search box
    //is done on login stage, but since we are skipping that part it has to be done here
    //TODO - somehow prevent this code duplication
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

  //title and active menu changing
  $rootScope.activePath = null;
  $rootScope.$on('$routeChangeSuccess', function() {

    //no guests allowed
    if (!$rootScope.loggedIn) {
      //TODO return to REFERER $rootScope.returnUrl = $location.path();
      $location.path('/login');
    }

    if ($route.current && $route.current.$route && $route.current.$route.title_prefix) {
      $rootScope.page_title = $route.current.$route.title_prefix + " - Zabbix";
    } else {
      $rootScope.page_title = "Zabbix";
    }
    $rootScope.activePath = $location.path();
  });
});

//HTTP interceptor, when there is AJAX request in progress, it shows "Loading"
angular.module('SharedServices', [])
  .config(function($httpProvider) {
  $httpProvider.responseInterceptors.push('myHttpInterceptor');
  var spinnerFunction = function(data, headersGetter) {
    $('#loading').show();
    return data;
  };
  $httpProvider.defaults.transformRequest.push(spinnerFunction);
}).factory('myHttpInterceptor', function($q, $window) {
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

  //focusing on inputName input box for easier navigation
  $('#inputName').focus();

  //login function
  $scope.login = function() {
    //ID doesn't have to be unique, but it's mandatory, so it was decided to use current time
    //as an identification for requests
    $rootScope.auth_id = Date.now();
    localStorageService.add('auth_id', $rootScope.auth_id); //saving this ID for session restoration

    //login request
    $http.post(api_url, {
      "jsonrpc": "2.0",
      "method": "user.login",
      auth: $rootScope.auth,
      "params": {
        "user": $scope.inputName,
        "password": $scope.inputPassword //TODO - encryption. Will require server side modification too.
      },
      "id": $rootScope.auth_id
    }).success(function(data) {
      if (data.error) {

        //unsuccessful login
        $scope.error = data.error; //for showing responsed error
        $('#inputName').focus(); //restoring focus

      } else {

        //successful login
        localStorageService.add('auth', data.result); //saving auth key for session restoration


        $scope.error = null;
        $rootScope.auth = data.result;
        $rootScope.loggedIn = true;

        //getting list of monitored servers for autocompletion in search box
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
          //when is done redirects you to main page
          $location.path('/');
        });

      }
    });
  };
}

function logoutController(localStorageService, $rootScope, $http, $location) {

  //should not be accessible for guests anyway
  //extra security just in case
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
      //closes current session
      $rootScope.loggedIn = false;
      $rootScope.auth = null;
      $rootScope.auth_id = null;

      //clearing cookies/localstorage
      localStorageService.clearAll();
      localStorageService.cookie.clearAll();

      //redirects to login page
      $location.path('/login');
    });
  }
}

function menuController($scope, $location, $rootScope) {

  //function that is called on search form submition
  $scope.findServer = function() {
    //redirects to search page with right parameters
    if ($scope.searchQuery) $location.path('/search/' + $scope.searchQuery);
    $scope.searchQuery = ""; //clears input box
  };
}



function overviewController($rootScope, $scope, $http) {

  //should not be accessible for guests anyway
  //extra security just in case
  if ($rootScope.loggedIn) {

    //gets active hostgroups
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
      //gets active triggers for active hostgroups
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
          output: ['triggerid', 'priority', 'lastchange']
        }
      }).success(function(trigger_data) {
        //TODO
        for (var a = 0; a < data.result.length; a++) {
          data.result[a].errors = 0;
          data.result[a].errors_level = 0;
          data.result[a].lastchange = 0;
          data.result[a].lastchange_words = "";
        }

        //TODO PRIORITY
        //terribly awful solution
        for (var i = 0; i < trigger_data.result.length; i++) {
          for (var j = 0; j < trigger_data.result[i].groups.length; j++) {
            for (var k = 0; k < data.result.length; k++) {
              if (data.result[k].groupid == trigger_data.result[i].groups[j].groupid) {
                data.result[k].errors += 1;
                if (trigger_data.result[i].priority > data.result[k].errors_level) { data.result[k].errors_level = trigger_data.result[i].priority }
                if (trigger_data.result[i].lastchange > data.result[k].lastchange) { data.result[k].lastchange = trigger_data.result[i].lastchange }
              }
            }
          }
        }

        for (var ii=0; ii<data.result.length; ii++) {
          data.result[ii].lastchange_words = timeConverter(data.result[ii].lastchange);
        }
        $scope.server_groups = data.result;

      });
    });
  }
}

function serversController($rootScope, $scope, $http, $routeParams) {

  if ($rootScope.loggedIn) {
    //getting all hosts available
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

  //focusing on filterInput input box for easier searching
  $('#filterInput').focus();
}

function serversDetailsController($rootScope, $scope, $http, $routeParams) {
  //TODO PRIORITY

  if ($rootScope.loggedIn) {
    //redo UI, add all graphs on one page, make views for all servers unified

//**************standard testing area*************//
    // $http.post(api_url, {
    //   jsonrpc: '2.0',
    //   id: $rootScope.auth_id,
    //   auth: $rootScope.auth,
    //   method: 'graph.get',
    //   params: {
    //     hostids: $routeParams.serverId,
    //     output: ['graphid', 'name']
    //   }
    // }).success(function (data) {
    //   for (var i=0; i<data.result.length; i++) {
    //     if (data.result[i].name == 'CPU load') {
    //       $scope.loadId = data.result[i].graphid;
    //     }
    //     else if (data.result[i].name == 'CPU utilization') {
    //       $scope.utilId = data.result[i].graphid;
    //     }
    //     else if (data.result[i].name == 'Available memory') {
    //       $scope.memId = data.result[i].graphid;
    //     }
    //   }
    //   //console.log(data);
    // });

//**************standard testing area*************//

//**************highcharts testing area*************//

//testing data

  var dataForCharts = [
          {
              name: 'Dummy data 1',
              // Define the data points. All series have a dummy year
              // of 1970/71 in order to be compared on the same x axis. Note
              // that in JavaScript, months start at 0 for January, 1 for February etc.
              data: [
                  [Date.UTC(2013,  1, 10), 1.0],
                  [Date.UTC(2013,  1, 18), 1.0],
                  [Date.UTC(2013,  1, 24), 1.0],
                  [Date.UTC(2013,  2,  4), 0.98],
                  [Date.UTC(2013,  2, 11), 0.67],
                  [Date.UTC(2013,  2, 15), 2.73],
                  [Date.UTC(2013,  2, 25), 2.61]
              ]
          }, {
              name: 'Dummy data 2',
              data: [
                  [Date.UTC(2013,  1,  1), 1.38],
                  [Date.UTC(2013,  1,  8), 1.48],
                  [Date.UTC(2013,  1, 21), 1.5 ],
                  [Date.UTC(2013,  2, 12), 1.89],
                  [Date.UTC(2013,  2, 25), 2.0 ]
              ]
          }, {
              name: 'Dummy data 3',
              data: [
                  [Date.UTC(2013,  1,  1), 0.62],
                  [Date.UTC(2013,  1,  7), 0.65],
                  [Date.UTC(2013,  1, 23), 0.77],
                  [Date.UTC(2013,  2,  8), 0.77],
                  [Date.UTC(2013,  2, 14), 0.79],
                  [Date.UTC(2013,  2, 24), 0.86]
              ]
          }]

// functions used for zooming
    var currentZoom = null;
        var nowTime = new Date().getTime(); //now
        var fromTime = nowTime - (3600000 * 30 * 24);

        $scope.setZoom = function(zoom) {
          if (zoom == null) {
            //todo dates
            masterChart.xAxis[0].setExtremes(fromTime, nowTime, true, true);
            setZoom(fromTime, nowTime);
            return;
          } else {
            currentZoom = zoom;
            var from = nowTime - (zoom * 3600000);
            masterChart.xAxis[0].setExtremes(from, nowTime, true, true);
            setZoom(from, nowTime);
          }
        }
        var setZoom = function(zoomStart, zoomEnd) {
          masterChart.xAxis[0].removePlotBand('mask-before');
          masterChart.xAxis[0].removePlotBand('mask-after');

          masterChart.xAxis[0].addPlotBand({
            id: 'mask-before',
            from: fromTime, //TODO start point
            to: zoomStart,
            color: 'rgba(0,0,0,0.2)'
          });

          masterChart.xAxis[0].addPlotBand({
            id: 'mask-after',
            from: zoomEnd,
            to: nowTime, //TODO end point of graphs
            color: 'rgba(0,0,0,0.2)'
          });

          updateGraphs(zoomStart, zoomEnd);
        };
        var updateGraphs = function(min, max) {
          cpuChart.xAxis[0].setExtremes(min, max);
          loadChart.xAxis[0].setExtremes(min, max);
          memoryGraph.xAxis[0].setExtremes(min, max);
          //diskIOGraph.xAxis[0].setExtremes(min, max);
          //networkIOGraph.xAxis[0].setExtremes(min, max);     
        };

    //master timeline
        var masterChart = new Highcharts.Chart({
          chart: {
            renderTo: 'masterTimeline',
            height: 90,
            zoomType: 'x',
            events: {
              selection: function (event) {
                setZoom(event.xAxis[0].min, event.xAxis[0].max);
                return false;
              }
            }
          },
          title: {
            text: null
          },
          xAxis: {
            type: 'datetime',
            minRange: 3600000, //1 hour
            title: {
              text: null
            },
            plotBands: [{
              id: 'mask-before',
              from: fromTime,
              to: nowTime,
              color: 'rgba(0,0,0,0.2)'
            }]
          },
          yAxis: {
            gridLineWidth: 0,
            labels: {
              enabled: false
            },
            min: 0.6,
            title: {
              text: null
            },
            showFirstLabel: false
          },
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
              animation: false,
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
            type: 'area',
            //pointStart: fromTime,
            data: [
              [fromTime, 1],
              [nowTime, 1]
            ]
          }],
          exporting: {
            enabled: false
          }
        });

    //cpu load graph
        var loadChart = new Highcharts.Chart({
          chart: {
                    renderTo: 'loadGraph',
                    height: 250,
                    type: 'spline',
                    animation: false,
            zoomType: 'x',
            events: {
              selection: function (event) {
                if (event.resetSelection) {
                  $scope.setZoom(currentZoom);
                } else {
                  setZoom(event.xAxis[0].min, event.xAxis[0].max);
                }
              }
            },
            resetZoomButton: {
              position: {
                x: 0,
                y: -30
              },
              theme: {
                fill: 'white',
                stroke: 'silver',
                r: 0,
                states: {
                    hover: {
                        fill: '#41739D',
                        style: {
                            color: 'white'
                        }
                    }
                }
              }
            }
                },
                title: {
                  text: 'CPU Load'
                },
                xAxis: {
                  minRange: 3600000*2,
                  type: 'datetime',
                },
                yAxis: {
                    title: { text: null },
                    min: 0
                },
                tooltip: {
                    formatter: function() {
                      return '<b>'+ this.series.name +'</b><br/>'+
                      Highcharts.dateFormat('%e. %b', this.x) +': '+ this.y +' m';
                    }
                },
                plotOptions: {
                  series: {
                    animation: false,
                    marker: {
                      enabled: false
                    },
                    pointStart: fromTime
                  }
                },
                series: dataForCharts
        });

    //cpu util graph
        var cpuChart = new Highcharts.Chart({
          chart: {
            renderTo: 'cpuGraph',
            height: 250,
            type: 'spline',
            animation: false,
            zoomType: 'x',
            events: {
              selection: function (event) {
                if (event.resetSelection) {
                  $scope.setZoom(currentZoom);
                  return;
                } else {
                  setZoom(event.xAxis[0].min, event.xAxis[0].max);
                }
              }
            },
            resetZoomButton: {
              position: {
                x: 0,
                y: -30
              },
              theme: {
                fill: 'white',
                stroke: 'silver',
                r: 0,
                states: {
                    hover: {
                        fill: '#41739D',
                        style: {
                            color: 'white'
                        }
                    }
                }
              }
            }
          },
          title: {
              text: 'CPU Utilization'
          },
          xAxis: {
            minRange: 3600000*2,
            type: 'datetime'
          },
          yAxis: {
              title: { text: null },
              min: 0
          },
          tooltip: {
              formatter: function() {
                return '<b>'+ this.series.name +'</b><br/>'+
                Highcharts.dateFormat('%e. %b', this.x) +': '+ this.y +' m';
              }
          },
          plotOptions: {
            series: {
              animation: false,
              marker: {
                enabled: false
              },
              pointStart: fromTime
            }
          },
          series: dataForCharts
        });

    //ram graph
        var memoryGraph = new Highcharts.Chart({
          chart: {
                    renderTo: 'memoryGraph',
                    height: 300,
                    type: 'spline',
                    animation: false,
            zoomType: 'x',
            events: {
              selection: function (event) {

                if (event.resetSelection) {
                  $scope.setZoom(currentZoom);
                } else {
                  setZoom(event.xAxis[0].min, event.xAxis[0].max);
                }
              }
            },
            resetZoomButton: {
              position: {
                x: 0,
                y: -30
              },
              theme: {
                fill: 'white',
                stroke: 'silver',
                r: 0,
                states: {
                    hover: {
                        fill: '#41739D',
                        style: {
                            color: 'white'
                        }
                    }
                }
              }
            }
                },
                title: {
                    text: 'Physical Memory'
                },
                xAxis: {
                  minRange: 3600000*2,
                    type: 'datetime',
                },
                yAxis: {
                    title: { text: null },
                    min: 0,
                },
                tooltip: {
                    formatter: function() {
                      return false;
                    }
                },
                plotOptions: {
                  series: {
                    animation: false,
                    marker: {
                      enabled: false
                    },
                    pointStart: fromTime
                  }
                },
                series: dataForCharts
        });

    //**************highcharts testing area*************//
  
  }
}

function projectController($rootScope, $scope, $http, $routeParams, $location) {

  //redirects back to main page if user comes to this url without projectId
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
        selectHosts: ['hostid', 'available', 'host', 'status'],
        real_hosts: true,
        monitored_hosts: true
      }
    }).success(function (data, $timeout, $location) {
      $scope.hostgroupData = data.result[0];
    });
  }

  //focusing on filterInput input box for easier searching
  $('#filterInput').focus();
}


function tvController($scope, $http, $rootScope) {
  //get hostgroups
  //then for each hostgroup lead seperate thread with interval to refresh and get new data

  //getting hostgroup names
  var projects;
  var selectedGroups={};

  $http.post(api_url, {
    jsonrpc: '2.0',
    id: $rootScope.auth_id,
    auth: $rootScope.auth,
    method: 'hostgroup.get',
    params: {
      real_hosts: true,
      monitored_hosts: true,
      output: ['groupid', 'name'],
      selectHosts: ['hostid', 'available', 'name', 'host', 'status'],
      sortfield: 'name',
      search: {
        name: 'project'
      }
    }
  }).success(function (data) {
    $scope.projects = data.result;
    projects = data.result;
    for (var i=0; i<projects.length; i++) {
      selectedGroups[i] = true;
    }
    $scope.groupsShown = selectedGroups;
  });

  //TODO postavitj 3 otdelnih http posta!!

//   (function getHostsInfo() {
//     setTimeout(getHostsInfo, 15000);
// })();

  //user picks what groups he wants to see
  $scope.selectGroups = function (id) {
    if (selectedGroups[id]) {
      delete selectedGroups[id];
    } else {
      selectedGroups[id] = true;
    }
    $('#groupSelector' + id).toggleClass('active');
    $scope.groupsShown = selectedGroups;
  };


}
  
function searchController($rootScope, $scope, $http, $routeParams, $location) {
  $scope.searchPhrase = $routeParams.searchString;

  //if users enters url without search string
  if (!$routeParams.searchString) {
    $location.path('/');
  }

  //bluring away from serverSearch text input
  $("#serverSearch").blur();

  if ($rootScope.loggedIn) {

    //if users enters correct name of server, redirects to the page of server
    if ($rootScope.serversOnline) {
      var serverLength = $rootScope.serversOnline.length;
      for (var i=0; i<serverLength; i++) {
        if ($rootScope.serversOnline[i].name == $routeParams.searchString) {
          $location.path('/servers/' + $rootScope.serversOnline[i].hostid);
        }
      }
   }

    //getting hosts
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

    //getting hostgroups
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