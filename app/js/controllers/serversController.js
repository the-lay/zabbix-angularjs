'use strict';
/**
* @author Iļja Gubins <ilja.gubin@gmail.com>
*/

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