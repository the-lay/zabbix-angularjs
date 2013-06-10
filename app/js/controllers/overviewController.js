'use strict';
/**
* @author Iļja Gubins <ilja.gubins@exigenservices.com>
*/

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