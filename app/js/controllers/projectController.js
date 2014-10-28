'use strict';
/**
* @author Iļja Gubins <ilja.gubin@gmail.com>
*/

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