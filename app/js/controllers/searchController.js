'use strict';
/**
* @author Iļja Gubins <ilja.gubin@gmail.com>
*/

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