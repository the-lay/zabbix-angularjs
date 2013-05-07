'use strict';
/**
* @file AngularJS application configuration file.
* @author Iļja Gubins <ilja.gubins@exigenservices.com>
*/

/** 
* Global variable that specificies the direct URL to Zabbix JSON-RPC API.
* @global 
* @kind constant
*/
var api_url = 'http://zabbixcm02.internal.corp/api_jsonrpc.php';

/** 
* Global variable that specificies the direct URL to Zabbix.
* @global 
* @kind constant
*/
var zabbix_url = 'http://zabbixcm02.internal.corp';

/** 
* Global variable that specificies the update interval of notifications in Dashboard.
* @global 
* @kind constant
*/
var triggerUpdateInterval = 30000; //30 seconds

/** 
* Global variable that specificies the update interval of hostgroups in Dashboard.
* @global 
* @kind constant
*/
var hostgroupUpdateInterval = 600000; //10 minutes

/**
* Function that converts given UNIX timestamp to a string
* in dateformat 'd M Y, H:i:s'.
* @function dateConverter
* @param {timestamp} timestamp The timestamp in default Unix notation.
* @returns {String} String The string with date in format of 'd M Y, H:i:s'
* @example <caption>Example use of dateConverter() function</caption>
* // returns "23 02 1993, 12:26:30"
* dateConverter(730491990);
*/
function dateConverter(timestamp, format) {

  //JS uses nanoseconds, hence the *100 multiplication
  var a = new Date(timestamp * 1000);

  //short names of all twelve months
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  //thee variables used for getting timestamp time
  var hrs = a.getHours(),
    min = a.getMinutes(),
    sec = a.getSeconds();

  //improving readability: adding leading zero
  if (hrs === 0) { 
    hrs = "0" + hrs;
  }
  if (min < 10) {
    min = "0" + min;
  }
  if (sec < 10) {
    sec = "0" + sec;
  }

  if (!format) {
    //returns in format 'd M Y, H:i:s'
    return a.getDate() + ' ' + months[a.getMonth()] + ' ' + a.getFullYear() + ', ' + hrs + ':' + min + ':' + sec;
  } else if (format === "time") {
    return hrs + ':' + min + ':' + sec;
  }

}

/**
* Function that returns current time in format of 'H:i:s'
* @function timeConverter
* @returns {String} String The string with time in format 'H:i:s'
* @example <caption>Example use of timeCoverter() function</caption>
* // returns "13:36:20"
* timeCoverter();
*/
function timeConverter() {
  
  var currentTime = new Date();
  var hours = currentTime.getHours();
  var minutes = currentTime.getMinutes();
  var seconds = currentTime.getSeconds();

  //improving readability: adding leading zero
  if (hours === 0) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  //returns in format 'H:i:s'
  return hours + ":" + minutes + ":" + seconds;
}

/**
* AngularJS application settings object.
*/
var app = angular.module('zabbix', ['LocalStorageModule', 'SharedServices', 'templates-main'])
  .config(function ($routeProvider, $locationProvider) {

    /**
    * Routes provider. Specifies available URLs and controllers and views for it.
    * @member $routeProvider
    */
    $routeProvider.
      //Home aka. Overview
      when('/', {
        controller: overviewController,
        templateUrl: '../app/views/overview.html',
        // templateUrl: 'http://zabbixcm02.internal.corp/frontend/views/overview.html',
        title_prefix: 'Home'
      }).

      //List of all servers
      when('/servers', {
        controller: serversController,
        templateUrl: '../app/views/servers.html',
        // templateUrl: 'http://zabbixcm02.internal.corp/frontend/views/servers.html',
        title_prefix: 'Servers'
      }).

      //Data about one server
      when('/servers/:serverId', {
        controller: serversDetailsController,
        templateUrl: '../app/views/serverDetails.html',
        // templateUrl: 'http://zabbixcm02.internal.corp/frontend/views/serverDetails.html',
        title_prefix: 'Server'
      }).

      //Data about one project
      when('/project/:projectId', {
        controller: projectController,
        templateUrl: '../app/views/project.html',
        // templateUrl: 'http://zabbixcm02.internal.corp/frontend/views/project.html',
        title_prefix: 'Project'
      }).

      //Dashboard
      when('/dashboard', {
        controller: dashboardController,
        templateUrl: '../app/views/dashboard.html',
        // templateUrl: 'http://zabbixcm02.internal.corp/frontend/views/dashboard.html',
        title_prefix: 'Dashboard'
      }).

      //Search
      when('/search/:searchString', {
        controller: searchController,
        templateUrl: '../app/views/search.html',
        // templateUrl: 'http://zabbixcm02.internal.corp/frontend/views/search.html',
        title_prefix: 'Search'
      }).

      //Not logged in
      when('/login').

      //Logout
      when('/logout', {
        controller: logoutController,
        title_prefix: 'Logout',
        templateUrl: '../app/views/logout.html'
        // templateUrl: 'http://zabbixcm02.internal.corp/frontend/views/logout.html',
      }).

      //Everything else is 404
      otherwise({
        redirectTo: '/'
      });

    /**
    * Turns off or enables html5 mode for AngularJS.
    * @member $locationProvider.html5Mode
    */
    $locationProvider.html5Mode(false);

    /**
    * onFinishRender AngularJS directive. Used with ng-repeat.
    * Add "on-finish-render='eventName'" to object and listener for eventName event.
    * @member onFinishRender
    */
  }).directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) { //when the last has finished rendering
                $timeout(function () {
                    scope.$emit(attr.onFinishRender); //emit event
                });
            }
        }
    }
  });

/**
* Initialization part of application.
* @member app.run
*/
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
        monitored_hosts: true,
        output: ['name'],
        sortfield: 'name'
      }
    }).success(function (data) {
      $rootScope.serversOnline = data.result;
    });
  }
  //preventing page title flickering by assigning title before
  $rootScope.page_title = 'Home - Zabbix';

  //title and active menu changing event listener
  $rootScope.$on('$routeChangeSuccess', function () {

    //no guests allowed
    if (!$rootScope.loggedIn) {
      //TODO return to REFERER $rootScope.returnUrl = $location.path();
      //console.log('not logged in, routing to /login');
      $location.path('/login'); //TODO: implement returning back after logging in
    }

  //     $rootScope.$on('$routeChangeStart', function() {
  //   console.log('$routeChangeStart');
  //   if (!$rootScope.loggedIn) {
  //     //TODO return to REFERER $rootScope.returnUrl = $location.path();
  //     $location.path('/login'); //TODO: implement returning back after logging in
  //     $event.cancel();
  //   }
  // });

    //dynamic page title
    if ($route.current && $route.current.$route && $route.current.$route.title_prefix) {
      $rootScope.page_title = $route.current.$route.title_prefix + " - Zabbix";
    } else {
      $rootScope.page_title = "Zabbix";
    }

    //dashboard has different style, we need to assure that after leaving it
    //user will not have that style used anymore
    if ($location.path() !== '/dashboard') {
      $rootScope.fullscreen = '';
      return;
    }
  });
});

/**
* HTTP interceptor, when there is AJAX request in progress, it shows "Loading".
* Done for usability, user sees progress.
* @member myHttpInterceptor
*/
angular.module('SharedServices', []).config(function ($httpProvider) {
  $httpProvider.responseInterceptors.push('myHttpInterceptor');
  var spinnerFunction = function (data, headersGetter) {
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