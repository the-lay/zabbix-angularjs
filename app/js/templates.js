angular.module('templates-main', ['../app/views/dashboard.html', '../app/views/login.html', '../app/views/logout.html', '../app/views/overview.html', '../app/views/project.html', '../app/views/search.html', '../app/views/serverDetails.html', '../app/views/servers.html']);

angular.module("../app/views/dashboard.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../app/views/dashboard.html",
    "<div class=\"container-fluid\" style=\"{{fullscreen}}\">\n" +
    "  <div class=\"row-fluid\" style=\"{{fullscreen}}\">\n" +
    "\n" +
    "    <div class=\"span2\">\n" +
    "      <div id=\"groups\">\n" +
    "        <h3 style=\"margin:0\">Groups <small><a href=\"\" ng-click=\"toggleGroupSelector()\">Hide</a></small></h3><hr style=\"margin-top:0\">\n" +
    "        <ul id=\"groupSelector\"class=\"nav nav-pills nav-stacked\" ng-cloak>\n" +
    "          <li ng-repeat=\"group in hostgroupsData\" style=\"height:31px; margin-bottom:7px;\">\n" +
    "            <a ng-click=\"selectGroup(group.groupid)\" href=\"\"><i class=\"icon-ok icon-white\" ng-show=\"selectedGroups[group.groupid] || selectedGroups['all']\"></i>{{group.name}}</a>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "      <div id=\"notifications\">\n" +
    "        <h3 style=\"margin:0\">Notifications</h3>\n" +
    "        <div style=\"margin-bottom:10px;\" id=\"notification-{{trigger.hosts[0].hostid}}\" style=\"margin-top:0; padding-top:0\" ng-repeat=\"trigger in triggersData | orderBy: '-priority'\" class=\"error{{trigger.priority}}\" ng-show=\"selectedGroups[trigger.groups[0].groupid] || selectedGroups['all']\" on-finish-render=\"triggersRenderingFinished\">{{trigger.description}}</div>\n" +
    "        <p><a ng-click=\"toggleGroupSelector()\" href=\"\" id=\"toggleGroups\">{{groupSelectorShown || 'Hide'}} group selection</a></p>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div id=\"serversDiv\" class=\"span10\">\n" +
    "        <div class=\"row-fluid\" ng-repeat=\"group in hostgroupsData\" id=\"groupHosts{{group.groupid}}\" ng-show=\"selectedGroups[group.groupid] || selectedGroups['all']\" on-finish-render=\"serversRenderingFinished\">\n" +
    "\n" +
    "          <h4 class=\"groupNames\"><a ng-show=\"group.map\" href=\"http://zabbixcm02.internal.corp/maps.php?sysmapid={{group.map}}\"><strong>{{group.name}}</strong></a><strong ng-hide=\"group.map\">{{group.name}}</strong></h4><hr style=\"margin:0\">\n" +
    "          <div class=\"server {{host.hostid}}\" ng-repeat=\"host in group.hosts | orderBy: 'name'\" ng-show=\"host.status==0\">\n" +
    "            <a class=\"serverLink\" href=\"#/servers/{{host.hostid}}\">{{host.name}}</a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-show=\"lastUpdated\" style=\"margin-bottom:5px;\" class=\"pull-right\">\n" +
    "      Last updated: <strong>{{lastUpdated}}</strong><br/>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "</div>");
}]);

angular.module("../app/views/login.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../app/views/login.html",
    "<div>\n" +
    "  <form class=\"form-horizontal\" name=\"loginForm\" ng-submit=\"login()\" action=\"\">\n" +
    "    <div class=\"control-group\">\n" +
    "      <label class=\"control-label\" for=\"inputName\">Username</label>\n" +
    "      <div class=\"controls\">\n" +
    "        <input type=\"text\" ng-model=\"inputName\" id=\"inputName\" placeholder=\"Username\" required>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"control-group\">\n" +
    "      <label class=\"control-label\" for=\"inputPassword\">Password</label>\n" +
    "      <div class=\"controls\">\n" +
    "        <input type=\"password\" ng-model=\"inputPassword\" id=\"inputPassword\" placeholder=\"Password\" required>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"control-group\">\n" +
    "      <div class=\"controls\">\n" +
    "        <button type=\"submit\" class=\"btn\">Sign in</button>\n" +
    "        <span ng-cloak ng-show=\"error\" class=\"help-block\">{{error.data}}</span>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </form>\n" +
    "</div>");
}]);

angular.module("../app/views/logout.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../app/views/logout.html",
    "<h3 style=\"align:center\"> Logging you out! </h3>");
}]);

angular.module("../app/views/overview.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../app/views/overview.html",
    "<div class=\"container-fluid\">\n" +
    "  <table class=\"table table-bordered\">\n" +
    "    <thead>\n" +
    "      <tr>\n" +
    "        <th>Group name</th>\n" +
    "        <th>Servers status</th>\n" +
    "        <th>Latest issue</th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody ng-repeat=\"group in serverGroups | orderBy:'-errors_level'\">\n" +
    "        <tr>\n" +
    "          <td><a href=\"#/project/{{group.groupid}}\">{{group.name}}</a></td>\n" +
    "          <td colspan=\"{{((group.lastchange) && ('1') || ('2'))}}\" class=\"{{'error' + group.errors_level}}\"><a class=\"underlined\" href=\"\" onClick=\"$('#errorsRow'+{{$index}}).toggle();\"><ng-pluralize count=\"group.errors\" when=\"groupErrorsPluralize\"></ng-pluralize></a></td>\n" +
    "          <td ng-show=\"group.lastchange\">{{group.lastchange_words}}</td>\n" +
    "        </tr>\n" +
    "        <tr style=\"display:none; margin: 0; padding: 0;\" id=\"errorsRow{{$index}}\">\n" +
    "          <td colspan=\"3\">\n" +
    "            <table class=\"table table-hover table-condensed\">\n" +
    "              <thead>\n" +
    "                <tr>\n" +
    "                  <th>Severity</th>\n" +
    "                  <th>Server</th> \n" +
    "                  <th>Description</th>\n" +
    "                  <th>Time</th>\n" +
    "                </tr>\n" +
    "              </thead>\n" +
    "              <tbody>\n" +
    "                <tr ng-repeat=\"error in triggerDetails[group.groupid] | orderBy: '-priority'\" class=\"errorsOverview\">\n" +
    "                  <td class=\"error{{error.priority}}\">{{triggerSeverity[error.priority]}}</td>\n" +
    "                  <td><a href=\"#/servers/{{error.hostid}}\">{{error.hostname}}</a></td>\n" +
    "                  <td>{{error.description}}</td>\n" +
    "                  <td>{{error.lastchange_words}}</td>\n" +
    "                </tr>\n" +
    "              </tbody>\n" +
    "            </table>\n" +
    "          </td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "  <table class=\"pull-right\">\n" +
    "    <tr>\n" +
    "      <td class=\"hidden-phone\">Legend:&nbsp</td>\n" +
    "      <td class=\"error0 table-bordered\">&nbspFine&nbsp</td>\n" +
    "      <td class=\"error1 table-bordered\">&nbspInformation&nbsp</td>\n" +
    "      <td class=\"error2 table-bordered\">&nbspWarning&nbsp</td>\n" +
    "      <td class=\"error3 table-bordered\">&nbspAverage&nbsp</td>\n" +
    "      <td class=\"error4 table-bordered\">&nbspHigh&nbsp</td>\n" +
    "      <td class=\"error5 table-bordered\">&nbspDisaster&nbsp</td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "</div>");
}]);

angular.module("../app/views/project.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../app/views/project.html",
    "<div class=\"container-fluid\">\n" +
    "  <caption>\n" +
    "    <h3>Servers of {{hostgroupData.name}} </h3> \n" +
    "  </caption>\n" +
    "\n" +
    "  <div class=\"input-prepend\" class=\"span10\">\n" +
    "    <span class=\"add-on\">Filter:</span>\n" +
    "    <input ng-model=\"filterString\" id=\"filterInput\" class=\"input-block-level\" type=\"text\">\n" +
    "  </div>\n" +
    "\n" +
    "  <table class=\"table table-hover table-bordered\">\n" +
    "    <thead>\n" +
    "      <tr>\n" +
    "        <th>Host name</th>\n" +
    "        <th>Zabbix agent</th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "        <tr ng-repeat=\"host in hostgroupData.hosts | filter:filterString\">\n" +
    "          <td><a href=\"#/servers/{{host.hostid}}\">{{host.name}}</a></td>\n" +
    "          <td ng-show=\"host.available==0\" class=\"error3\">Down</td>\n" +
    "          <td ng-show=\"host.available==2\" class=\"error3\">Error</td>\n" +
    "          <td ng-show=\"host.available==1\" class=\"error0\">Up</td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>");
}]);

angular.module("../app/views/search.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../app/views/search.html",
    "<div ng-cloak>\n" +
    "<h3>Search results for: {{searchPhrase}}</h3>\n" +
    "\n" +
    "<div ng-show=\"hostsData\">\n" +
    "  <h4>hosts found</h4>\n" +
    "  <ul>\n" +
    "    <li ng-repeat=\"host in hostsData\">\n" +
    "      <a href=\"#/servers/{{host.hostid}}\" class=\"foundHosts\">{{host.name}}</a>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-show=\"groupsData\">\n" +
    "  <h4>hostgroups found</h4>\n" +
    "  <ul>\n" +
    "    <li ng-repeat=\"group in groupsData\">\n" +
    "      <a href=\"#/project/{{group.hostid}}\" class=\"foundHostgroups\">{{group.name}}</a>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n" +
    "\n" +
    "</div>");
}]);

angular.module("../app/views/serverDetails.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../app/views/serverDetails.html",
    "<div class=\"container-fluid\">\n" +
    "  <div class=\"row-fluid\" ng-cloak>\n" +
    "    <div class=\"span5\" id=\"currentStats\">\n" +
    "      <h4>Current statistics of {{serverName}}</h4>\n" +
    "      <div class=\"input-prepend\" class=\"span10\">\n" +
    "        <span class=\"add-on\">Filter:</span>\n" +
    "        <input ng-model=\"filterString\" id=\"filterInput\" class=\"input-block-level\" type=\"text\">\n" +
    "      </div>\n" +
    "      <table class=\"table table-condensed\">\n" +
    "        <thead>\n" +
    "          <tr>\n" +
    "            <th>Key</th>\n" +
    "            <th>Value</th>\n" +
    "            <th>When</th>\n" +
    "          </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "          <tr ng-repeat=\"item in itemsData | filter:filterString\" class=\"currentStats\">\n" +
    "            <td>\n" +
    "              <a href=\"{{zabbix_url}}/history.php?action=showgraph&itemid={{item.itemid}}\" ng-show=\"item.value_type==0 || item.value_type==3\">{{item.name}}</a>\n" +
    "              <a href=\"{{zabbix_url}}/history.php?action=showvalues&itemid={{item.itemid}}\" ng-hide=\"item.value_type==0 || item.value_type==3\">{{item.name}}</a>\n" +
    "            </td>\n" +
    "            <td>{{item.lastvalue}} {{item.units}}</td>\n" +
    "            <td>{{item.lastclock}}\n" +
    "          </tr>\n" +
    "        </tbody>\n" +
    "      </table>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"span5\" id=\"inventoryInfo\">\n" +
    "      <h4>Inventory info of {{serverName}}</h4>\n" +
    "      <table class=\"table table-condensed\">\n" +
    "        <thead>\n" +
    "          <tr>\n" +
    "            <th>Key</th>\n" +
    "            <th>Value</th>\n" +
    "          </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "          <tr ng-repeat=\"(key, value) in inventoryData\" ng-show=\"value\" class=\"inventoryInfo\">\n" +
    "            <td>{{key}}</td>\n" +
    "            <td>{{value}}</td>\n" +
    "          </tr>\n" +
    "        </tbody>\n" +
    "      </table>\n" +
    "    </div>\n" +
    "    <div class=\"span2 static\" id=\"links\">\n" +
    "      <h4>Links <small>on old frontend</small></h4>\n" +
    "      <ul class=\"nav nav-pills nav-stacked\">\n" +
    "        <li><a href=\"{{zabbix_url}}/charts.php?hostid={{hostId}}&graphid=0\" id=\"graphsLink\">Graphs</a></li>\n" +
    "        <li><a href=\"{{zabbix_url}}/latest.php?open=1&hostid={{hostId}}\" id=\"latestDataLink\">Latest data</a></li>\n" +
    "        <li><a href=\"{{zabbix_url}}/events.php?hostid={{hostId}}&source=0\" id=\"eventsLink\">Events</a></li>\n" +
    "        <li><a href=\"{{zabbix_url}}/tr_status.php?hostid={{hostId}}\" id=\"triggersLink\">Triggers</a></li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>");
}]);

angular.module("../app/views/servers.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../app/views/servers.html",
    "<div class=\"container-fluid\">\n" +
    "  <div class=\"input-prepend\" class=\"span10\">\n" +
    "    <span class=\"add-on\">Filter:</span>\n" +
    "    <input ng-model=\"filterString\" id=\"filterInput\" class=\"input-block-level\" type=\"text\">\n" +
    "  </div>\n" +
    "\n" +
    "  <table class=\"table table-hover table-bordered\">\n" +
    "    <thead>\n" +
    "      <tr>\n" +
    "        <th>Host name</th>\n" +
    "        <th>Zabbix agent</th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "        <tr ng-repeat=\"host in hostsData | filter:filterString\">\n" +
    "          <td><a href=\"#/servers/{{host.hostid}}\">{{host.name}}</a></td>\n" +
    "          <td ng-show=\"host.available==0\" class=\"error3\">Down</td>\n" +
    "          <td ng-show=\"host.available==2\" class=\"error3\">Error</td>\n" +
    "          <td ng-show=\"host.available==1\" class=\"error0\">Up</td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>");
}]);
