'use strict';
/**
* @author Iļja Gubins <ilja.gubin@gmail.com>
*/

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
          $('div[data-notification-host-id!=""]').hover(
            function () {
              $('div[data-server-id='+$(this).data('notification-host-id')+']').
              addClass('zoomUp'); //200% zoom, check style.css for details
            },
            function () {
              $('div[data-server-id='+$(this).data('notification-host-id')+']').
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
      $('div[data-server-id='+triggersData[i].hosts[0].hostid+']').tooltip({title: triggersData[i].description})
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