// Karma configuration
// Generated on Mon Apr 15 2013 20:56:23 GMT-0400 (Eastern Daylight Time)
basePath = '../';
urlRoot = 'e2e';
files = [
  ANGULAR_SCENARIO,
  ANGULAR_SCENARIO_ADAPTER,
  'test/scenarios/*.js',
  'test/angular-mocks.js'
];
proxies = {
  '/': 'http://zabbixcm02.internal.corp/frontend/'
};
exclude = [];
reporters = ['progress'];
port = 9876;
runnerPort = 9100;
colors = true;
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;
autoWatch = false;
//browsers = ['Chrome'];
captureTimeout = 60000;
singleRun = false;