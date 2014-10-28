'use strict';
/**
* @author Iļja Gubins <ilja.gubin@gmail.com>
*/

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