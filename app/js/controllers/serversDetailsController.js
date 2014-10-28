'use strict';
/**
* @author Iļja Gubins <ilja.gubin@gmail.com>
*/

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