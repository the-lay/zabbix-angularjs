'use strict';
/**
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