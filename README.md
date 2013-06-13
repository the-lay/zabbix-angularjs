***Zabbix Dashboard***

**Intro**
The project was started with the goal to make a dashboard that will be used as a central place to check the current status of the company's projects.  

In time the project has grown to a full-blown frontend wrapper with not just dashboard, but stuff like server detailed view, groups overview and search function.   

**Using**
It was decided to use AngularJS for implementation and Twitter Bootstrap (with free Cosmo theme) for a quick way to make design. Extra tools used - Karma Test Runner, Grunt, lots of Grunt addons (see Gruntfile.js) and JSDoc (needs Java installed and JAVA_HOME var in path).

**Build process**
Execute `grunt` in terminal/cmd. It produces minified and concated files that app uses. 
