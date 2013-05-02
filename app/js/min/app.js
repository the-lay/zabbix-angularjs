/*! angular 2013-05-02 */
"use strict";function dateConverter(e,t){var r=new Date(1e3*e),o=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],n=r.getHours(),l=r.getMinutes(),i=r.getSeconds();return 0===n&&(n="0"+n),10>l&&(l="0"+l),10>i&&(i="0"+i),t?"time"===t?n+":"+l+":"+i:void 0:r.getDate()+" "+o[r.getMonth()]+" "+r.getFullYear()+", "+n+":"+l+":"+i}function timeConverter(){var e=new Date,t=e.getHours(),r=e.getMinutes(),o=e.getSeconds();return 0===t&&(t="0"+t),10>r&&(r="0"+r),10>o&&(o="0"+o),t+":"+r+":"+o}var api_url="http://zabbixcm02.internal.corp/api_jsonrpc.php",zabbix_url="http://zabbixcm02.internal.corp",triggerUpdateInterval=3e4,hostgroupUpdateInterval=6e5,app=angular.module("zabbix",["LocalStorageModule","SharedServices"]).config(function(e,t){e.when("/",{controller:overviewController,templateUrl:"views/overview.html",title_prefix:"Home"}).when("/overview",{controller:overviewController,templateUrl:"views/overview.html",title_prefix:"Home"}).when("/servers",{controller:serversController,templateUrl:"views/servers.html",title_prefix:"Servers"}).when("/servers/:serverId",{controller:serversDetailsController,templateUrl:"views/serverDetails.html",title_prefix:"Server"}).when("/project/:projectId",{controller:projectController,templateUrl:"views/project.html",title_prefix:"Project"}).when("/dashboard",{controller:dashboardController,templateUrl:"views/dashboard.html",title_prefix:"Dashboard"}).when("/search/:searchString",{controller:searchController,templateUrl:"views/search.html",title_prefix:"Search"}).when("/login").when("/logout",{controller:logoutController,title_prefix:"Logout",templateUrl:"views/logout.html"}).otherwise({redirectTo:"/"}),t.html5Mode(!1)}).directive("onFinishRender",function(e){return{restrict:"A",link:function(t,r,o){t.$last===!0&&e(function(){t.$emit(o.onFinishRender)})}}});app.run(function(e,t,r,o,n){!e.loggedIn&&n.get("auth")&&(e.auth=n.get("auth"),e.auth_id=n.get("auth_id"),e.loggedIn=!0,r.post(api_url,{jsonrpc:"2.0",id:e.auth_id,auth:e.auth,method:"host.get",params:{monitored_hosts:!0,output:["name"],sortfield:"name"}}).success(function(t){e.serversOnline=t.result})),e.page_title="Home - Zabbix",e.$on("$routeChangeSuccess",function(){return e.loggedIn||(console.log("not logged in, routing to /login"),o.path("/login")),e.page_title=t.current&&t.current.$route&&t.current.$route.title_prefix?t.current.$route.title_prefix+" - Zabbix":"Zabbix","/dashboard"!==o.path()?(e.fullscreen="",void 0):void 0})}),angular.module("SharedServices",[]).config(function(e){e.responseInterceptors.push("myHttpInterceptor");var t=function(e){return $("#loading").show(),e};e.defaults.transformRequest.push(t)}).factory("myHttpInterceptor",function(e){return function(t){return t.then(function(e){return $("#loading").hide(),e},function(t){return $("#loading").hide(),e.reject(t)})}});