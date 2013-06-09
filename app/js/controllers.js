'use strict';
/**
* @file Controllers file of AngularJS application.
* @author Iļja Gubins <ilja.gubins@exigenservices.com>
*/

/**
* Controller used for logging in the system. Used with view login.html.
* Parameters are dependency injected.
* @function loginController
* @param $http Used for handling XHR requests.
* @param $rootScope Used for global vars.
* @param $scope Used for data manipulation.
* @param $location Used for handing redirecting.
* @param localStorageService Used for working with session params.
*/
function loginController($scope, $http, $rootScope, $location, localStorageService) {

  //focusing on inputName input box for easier navigation
  $('#inputName').focus();
  
  //login function
  $scope.login = function() {
    //ID doesn't have to be unique, but it's mandatory for using API, so it was decided to use current time
    //as an identification for requests
    $rootScope.auth_id = Date.now();
    localStorageService.add('auth_id', 
      $rootScope.auth_id); //saving this ID for session restoration

    //login request
    $http.post(GlobalVars.api_url(), {
      "jsonrpc": "2.0",
      "method": "user.login",
      auth: $rootScope.auth,
      "params": {
        "user": $scope.inputName,
        "password": $scope.inputPassword
      },
      "id": $rootScope.auth_id
    }).success(function (userData) {
      if (userData.error) {

        //unsuccessful login
        $scope.error = userData.error; //for showing responsed error
        $('#inputName').focus(); //restoring focus

      } else {

        //successful login
        localStorageService.add('auth', userData.result); //saving auth key for session restoration

        $rootScope.auth = userData.result;
        $rootScope.loggedIn = true;
        $scope.inputName = "";
        $scope.inputPassword = "";
        $('#inputName').focus();

        //getting list of monitored servers for autocompletion in search box
        $http.post(GlobalVars.api_url(), {
          jsonrpc: "2.0",
          id: $rootScope.auth_id,
          auth: $rootScope.auth,
          method: 'host.get',
          params: {
            monitored_hosts: true,
            output: ['name'],
            sortfield: 'name'
          }
        }).success(function (hostsData) {
          $rootScope.serversOnline = hostsData.result;
          //when done redirects you to main page
          $location.path('/');
        });

      }
    });
  };
}

/**
* Controller used for logging out of the system. Used with view logout.html.
* Parameters are dependency injected.
* @function logoutController
* @param $http Used for handling XHR requests.
* @param $rootScope Used for global vars.
* @param $location Used for handing redirecting.
* @param localStorageService Used for working with session params.
*/
function logoutController(localStorageService, $rootScope, $http, $location) {

  //should not be accessible for guests anyway
  //extra security just in case
  if ($rootScope.loggedIn) {
    $http.post(GlobalVars.api_url(), {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'user.logout',
      params: {}
    }).success(function (data) {
      //closes current session
      $rootScope.loggedIn = false;
      $rootScope.auth = null;
      $rootScope.auth_id = null;

      //clearing cookies/localstorage
      localStorageService.clearAll();

      //redirects to login page
      $location.path('/login');
    });
  }
}

/**
* Controller used for top menu. Used with view index.html -> #head -> .container-fluid.
* Parameters are dependency injected.
* @function menuController
* @param $rootScope Used for global vars.
* @param $scope Used for data manipulation.
* @param $location Used for handing redirecting.
*/
function menuController($scope, $location, $rootScope) {

  //mobile view
  //navbar collapsing back if clicked on any nav link
  $('.nav-collapse a').click(function(e) {
    if ($('#collapsingBtn').is(":visible")) {
      $('.nav-collapse').collapse('toggle');
    }
  });

  /**
  * Function used to initialize searching. Redirects user to /search/searchParams.
  * @function $scope.findServer()
  */
  $scope.findServer = function() {
    //redirects to search page with right parameters
    if ($scope.searchQuery) $location.path('/search/' + $scope.searchQuery);
    $scope.searchQuery = ""; //clears input box
  };
}

/**
* Controller used for zabbix overview (main page). Used with view overview.html.
* Parameters are dependency injected.
* @function overviewController
* @param $rootScope Used for global vars.
* @param $scope Used for data manipulation.
* @param $http Used for handling XHR requests.
* @param $q Used for handling promises.
*/
function overviewController($rootScope, $scope, $http, $q) {

  //should not be accessible for guests anyway
  //extra security just in case
  if ($rootScope.loggedIn) {

    //pluralization of error notifications on overview
    $scope.groupErrorsPluralize = {
      0: ' ', //if zero errors we don't want to show anything
      one: '{} error!',
      other: '{} errors!'
    };

    //severity of triggers
    $scope.triggerSeverity = ['Fine', 'Information', 'Warning', 'Average', 'High', 'Disaster'];

    var groupsRequest = $http.post(GlobalVars.api_url(), {
        jsonrpc: "2.0",
        id: $rootScope.auth_id,
        auth: $rootScope.auth,
        method: 'hostgroup.get',
        params: {
          output: ['groupid', 'name'],
          sortfield: 'name',
          real_hosts: true
        }
      }); //will work with request through $q
    var triggersRequest = $http.post(GlobalVars.api_url(), {
        jsonrpc: "2.0",
        id: $rootScope.auth_id,
        auth: $rootScope.auth,
        method: 'trigger.get',
        params: {
          selectGroups: 'refer',
          expandDescription: true,
          expandData: true,
          only_true: true,
          sortfield: 'lastchange',
          filter: {
            "value": 1
          },
          skipDependent: true,
          monitored: true,
          output: ['triggerid', 'priority', 'lastchange', 'description']
        }
      }).success(function (triggersData) {
        for(var i=0; i<triggersData.result.length; i++) {
          triggersData.result[i].lastchange_words = dateConverter(triggersData.result[i].lastchange);
        }
      });

    //$q is internal kriskowal's Q library implementation
    //it provides API to work with promises
    $q.all([groupsRequest, triggersRequest]).then(function (data) {
      //making new vars for readability
      var groupsData = data[0].data.result;
      var triggerData = data[1].data.result;
      var triggerDetails = {};

      function initializeData(groupsData) { //adding needed fields to groupsData object
        var deferred = $q.defer();
        for (var i = groupsData.length - 1; i >= 0; i--) {
          groupsData[i].lastchange = 0;
          groupsData[i].lastchange_words = "";
          groupsData[i].errors = 0;
          groupsData[i].errors_level = 0;
          triggerDetails[groupsData[i].groupid] = [];
        }
        deferred.resolve(); //promise used to ensure that data first will be initialized
        return deferred.promise;
      }

      var promise = initializeData(groupsData);
      promise.then(function() {


        //ticket #9
        for (var i=0; i<groupsData.length; i++) {
          for (var j=0; j<triggerData.length; j++) {
            for (var k=0; k<triggerData[j].groups.length; k++) {

              if (triggerData[j].groups[k].groupid === groupsData[i].groupid) {
              //if this trigger is related to this hostgroup
                groupsData[i].errors += 1; //increase errors count
                triggerDetails[groupsData[i].groupid].push(triggerData[j]);
                //triggerDetails is an object for storing related triggers

                if (triggerData[j].lastchange > groupsData[i].lastchange) {
                  //time of the last issue
                  groupsData[i].lastchange = triggerData[j].lastchange;
                  groupsData[i].lastchange_words = dateConverter(triggerData[j].lastchange);
                  //we also convert timestamp to readable format
                }
                if (triggerData[j].priority > groupsData[i].errors_level) {
                  //storing the level of the highest error in this hostgroup
                  groupsData[i].errors_level = triggerData[j].priority;
                }
              }

            }
          }
        }

        //return back to $scope
        $scope.serverGroups = groupsData;
        $scope.triggerDetails = triggerDetails;

      });
    });
  }
}

/**
* Controller used for overview of all servers in the system. Used with view servers.html.
* Parameters are dependency injected.
* @function serversController
* @param $rootScope Used for global vars.
* @param $scope Used for data manipulation.
* @param $http Used for handling XHR requests.
* @param $routeParams Used for requesting URL parameters.
*/
function serversController($rootScope, $scope, $http, $routeParams) {

  if ($rootScope.loggedIn) {
    //getting all hosts available
    $http.post(GlobalVars.api_url(), {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'host.get',
      params: {
        //selectTriggers: ['only_true'],
        monitored_hosts: true,
        output: ['name', 'available', 'hostid', 'host']
      }
    }).success(function (hostsData) {
      $scope.hostsData = hostsData.result;
    });
  }

  //focusing on filterInput input box for easier searching
  $('#filterInput').focus();
}

/**
* Controller used for detail overview of specific server. Used with view serverDetails.html.
* Parameters are dependency injected.
* @function serversDetailsController
* @param $rootScope Used for global vars.
* @param $scope Used for data manipulation.
* @param $http Used for handling XHR requests.
* @param $routeParams Used for requesting URL parameters.
* @param $location Used for handing redirecting.
*/
function serversDetailsController($rootScope, $scope, $http, $routeParams, $location) {

    if ($rootScope.loggedIn) {

      //redirects back to main page if user comes to this url with serverId
      if (!$routeParams.serverId) {
        $location.path('/');
      }
    
      //host info
      $http.post(GlobalVars.api_url(), {
        jsonrpc: '2.0',
        id: $rootScope.auth_id,
        auth: $rootScope.auth,
        method: 'host.get',
        params: {
          selectInventory: true,
          selectItems: ['name','lastvalue',
            'units','itemid','lastclock','value_type','itemid'],
          output: 'extend',
          hostids: $routeParams.serverId,
          expandDescription: 1,
          expandData:1
        }
      }).success(function (hostData) {
        $scope.inventoryData = hostData.result[0].inventory;
        $scope.serverName = hostData.result[0].name;
        $scope.zabbix_url = GlobalVars.zabbix_url();
        $scope.hostId = $routeParams.serverId;
        if ($scope.itemsData = hostData.result[0].items) {
          for (var i = $scope.itemsData.length - 1; i >= 0; i--) {
            $scope.itemsData[i].lastclock = dateConverter($scope.itemsData[i].lastclock, "time");
          }
        }
        $('#filterInput').focus();
      });
    }
}

/**
* Controller used for all server of one project overview. Used with view project.html.
* Parameters are dependency injected.
* @function projectController
* @param $rootScope Used for global vars.
* @param $scope Used for data manipulation.
* @param $http Used for handling XHR requests.
* @param $routeParams Used for requesting URL parameters.
* @param $location Used for handing redirecting.
*/
function projectController($rootScope, $scope, $http, $routeParams, $location) {

  if ($rootScope.loggedIn) {
    //redirects back to main page if user comes to this url without projectId
    if (!$routeParams.projectId) {
      $location.path('/');
    }

    //shows all servers monitored in one hostgroup/project
    $http.post(GlobalVars.api_url(), {
      jsonrpc: "2.0",
      id: $rootScope.auth_id,
      method: 'hostgroup.get',
      auth: $rootScope.auth,
      params: {
        groupids: $routeParams.projectId,
        output: ['groupid', 'name'],
        sortfield: 'name',
        selectHosts: ['hostid', 'available', 'host', 'status', 'name'],
        real_hosts: true,
        monitored_hosts: true
      }
    }).success(function (projectData) {
      $scope.hostgroupData = projectData.result[0];
    });
  }

  //focusing on filterInput input box for easier searching
  $('#filterInput').focus();
}

/**
* Controller used for dashboard. Used with view dashboard.html.
* Parameters are dependency injected.
* @function dashboardController
* @param $rootScope Used for global vars.
* @param $scope Used for data manipulation.
* @param $http Used for handling XHR requests.
* @param localStorageService Used for working with session params.
* @param $location Used for handing redirecting.
* @param $q Used for handling promises.
*/
function dashboardController($scope, $http, $rootScope, $location, localStorageService, $q) {

  //variables
  $rootScope.fullscreen = 'padding-left:2px; padding-right:2px;'; //making dashboard wider
  $scope.selectedGroups = {};
  var firstTime = true,
    groupSelectorShown = true;

  //getting active hostgroups and their hosts
  (function activeHostgroupData() {

    //stop this function execution after leaving dashboard
    if ($location.path() !== '/dashboard') {
      $rootScope.fullscreen = '';
      return;
    }

    var hostgroupsRequest = $http.post(GlobalVars.api_url(), {
      jsonrpc: '2.0',
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'hostgroup.get',
      params: {
        real_hosts: true,
        monitored_hosts: true,
        output: ['groupid', 'name'],
        selectHosts: ['hostid', 'available', 'name', 'host', 'status'],
        sortfield: 'name'
      }
      }).success(function (hostgroupData) {

        if ($scope.hostgroupsData = hostgroupData.result) {
          
          $http.post(GlobalVars.api_url(), {
            jsonrpc: '2.0',
            id: $rootScope.auth_id,
            auth: $rootScope.auth,
            method: 'map.get',
            params: {
              output: ['sysmapid','name']
            }
          }).success(function (mapData) {
            //adding map as a property to each hostgroup
            for (var i = hostgroupData.result.length - 1; i >= 0; i--) {
              for (var j = mapData.result.length - 1; j >= 0; j--) {
                if (hostgroupData.result[i].name == mapData.result[j].name) {
                  $scope.hostgroupsData[i].map = mapData.result[j].sysmapid;
                }
              }
            }
          });
        }

        if (localStorageService.get('selectedGroups') === null) {
          //user doesn't have memory of this place
          for (var i = hostgroupData.result.length - 1; i >= 0; i--) {
            $scope.selectedGroups[hostgroupData.result[i].groupid] = true; //selecting everything
            localStorageService.add('selectedGroups', 
              JSON.stringify($scope.selectedGroups));
          }
        } else {
          //otherwise parse stringified object from localstorage
          $scope.selectedGroups = JSON.parse(localStorageService.get('selectedGroups'));
        }
      });

    setTimeout(activeHostgroupData, GlobalVars.hostgroupUpdateInterval()); //hostgroupUpdateInterval defined at the top
    //it is not intended for hostgroups to be added/removed frequently hence the big interval
  })();

  //getting current active triggers
  (function activeTriggersData() {

    //stop this function execution after leaving dashboard
    if ($location.path() !== '/dashboard') {
      $rootScope.fullscreen = '';
      return;
    }

    var triggersRequest = $http.post(GlobalVars.api_url(), {
      jsonrpc: '2.0',
      id: $rootScope.auth_id,
      auth: $rootScope.auth,
      method: 'trigger.get',
      params: {
        expandDescription: true, //transform macros to readable text
        expandData: true, //transform macros to readable text
        sortfield: 'priority',
        selectGroups: 'refer', //needed to show/hide triggers only that are in selected groups
        selectHosts: 'refer',
        filter: {
          value: 1
        },
        skipDependent: true,
        monitored: true,
        only_true: true,
        output: ['description', 'lastchange', 'priority', 'triggerid']
      }
      }).success(function (triggerData) {
        $scope.triggersData = triggerData.result;

        //showing last updated time for usability
        $scope.lastUpdated = timeConverter(new Date().getTime());

        //if it's first time then we should wait for servers grid finished rendenring
        //unfortunately listener then works when we refresh hostgroup list
        //that's why we need to recheck if it's firstTime again inside it
        if (firstTime) {
          $scope.$on('serversRenderingFinished', function() {
            if (!firstTime) {
              return;
            } else {
              if (removePrevTooltips(triggerData.result)) {
                addNewTooltips(triggerData.result);
              }
              firstTime = false;
            }
          });
        } else {
            if (removePrevTooltips(triggerData.result)) {
              addNewTooltips(triggerData.result);
            }
        }

        //when triggers divs are successfully rendered attaching hover event
        $scope.$on('triggersRenderingFinished', function() {
          //on hover on notifications highlight zoom the appropriate .server div
          $('div[id^="notification-"]').hover(
            function () {
              $('.'+$(this).attr('id').substring(13)).
              addClass('zoomUp'); //200% zoom, check style.css for details
            },
            function () {
              $('.'+$(this).attr('id').substring(13)).
              removeClass('zoomUp'); //removing zoom, back to 100%
            }
          );
        });

      });

    setTimeout(activeTriggersData, GlobalVars.triggerUpdateInterval());
  })();

  function removePrevTooltips(triggersData) {
    $('.server').tooltip('destroy').removeClass('error1 error2 error3 error4 error5');
    return true;
  }

  function addNewTooltips(triggersData) {
    for (var i = triggersData.length - 1; i >= 0; i--) {
        $('.'+triggersData[i].hosts[0].hostid).tooltip({title: triggersData[i].description})
          .addClass('error'+triggersData[i].priority);
    }
  }

  //function for selecting groups visible on dashboard via group selector
  $scope.selectGroup = function (groupId) {
    if ($scope.selectedGroups[groupId] === true) { //group was selected
      $scope.selectedGroups[groupId] = false; //not anymore
      localStorageService.add('selectedGroups', JSON.stringify($scope.selectedGroups));
      //writing down this change in localStorage/cookies
    } else {
      $scope.selectedGroups[groupId] = true;
      localStorageService.add('selectedGroups', JSON.stringify($scope.selectedGroups));
    }
  };

  //show/hide group selector
  $scope.toggleGroupSelector = function() {
    $('#groups').animate({height:'toggle'}, 'slow'); //beautifully hiding it
    if (groupSelectorShown) {
      groupSelectorShown = false;
      $scope.groupSelectorShown = 'Show';
    } else {
      groupSelectorShown = true;
      $scope.groupSelectorShown = 'Hide';
    }
  };
}


/**
* Controller used for search of servers and groups in the system. Used with view search.html.
* Parameters are dependency injected.
* @function searchController
* @param $rootScope Used for global vars.
* @param $scope Used for data manipulation.
* @param $http Used for handling XHR requests.
* @param $routeParams Used for requesting URL parameters.
* @param $location Used for handing redirecting.
*/
function searchController($rootScope, $scope, $http, $routeParams, $location) {

  $scope.searchPhrase = $routeParams.searchString;

  //if users enters url without search string
  //redirect him to the first page
  if (!$routeParams.searchString) {
    $location.path('/');
  }

  $("#serverSearch").blur(); //usability

  if ($rootScope.loggedIn) {

    //if users enters correct name of server, redirects to the page of server
    if ($rootScope.serversOnline && $rootScope.serversOnline.length) {

      for (var i = $rootScope.serversOnline.length - 1; i >= 0; i--) {

        if ($rootScope.serversOnline[i].name === $routeParams.searchString) {
          $location.path('/servers/' + $rootScope.serversOnline[i].hostid);
        }

      }
      
    }

    //host and hostgroup search query are async
    //getting hosts
    $http.post(GlobalVars.api_url(), {
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
      }).success(function (hostsData) {
        $scope.hostsData = hostsData.result;
      });

    //getting hostgroups
    $http.post(GlobalVars.api_url(), {
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
      }).success(function (hostgroupData) {
        $scope.groupsData = hostgroupData.result;
      });

  }
}