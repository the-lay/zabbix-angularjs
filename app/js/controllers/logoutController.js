'use strict';
/**
* @author Iļja Gubins <ilja.gubin@gmail.com>
*/

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