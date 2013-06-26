module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), //package information

    uglify: { //minification
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        report: 'gzip',
        mangle: false //mangling breaks AngularJS as it's mangling $scope and other vars
      },
      build: {
        files: {
          'app/js/min/app.js': ['app/js/app.js'],
          'app/js/min/dashboardController.js': ['app/js/controllers/dashboardController.js'],
          'app/js/min/loginController.js': ['app/js/controllers/loginController.js'],
          'app/js/min/logoutController.js': ['app/js/controllers/logoutController.js'],
          'app/js/min/menuController.js': ['app/js/controllers/menuController.js'],
          'app/js/min/overviewController.js': ['app/js/controllers/overviewController.js'],
          'app/js/min/projectController.js': ['app/js/controllers/projectController.js'],
          'app/js/min/searchController.js': ['app/js/controllers/searchController.js'],
          'app/js/min/serversController.js': ['app/js/controllers/serversController.js'],
          'app/js/min/serversDetailsController.js': ['app/js/controllers/serversDetailsController.js'],
          'app/js/min/localStorageModule.js': ['app/js/localStorageModule.js'],
          'app/js/min/templates.js': ['app/js/templates.js']
        }
      }
    },

    jsdoc: { //documentation for JS files
      src: ['app/js/*.js', 'test/scenarios/*.js'],
      options: {
        destination: 'docs'
      }
    },

    concat: { //concatenate JS files
      dist: {
        src: ['app/js/min/*.js'],
        dest: 'app/js/min/js.min.js'
      }
    },

    cssmin: { //minify CSS files
      with_banner: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
          report: 'gzip'
        },
        files: {
          'app/css/min/style.min.css': ['app/css/bootstrap-cosmo.min.css', 'app/css/bootstrap-responsive.min.css', 'app/css/style.css']
        }
      }
    },

    karma: { //run E2E tests
      e2e: {
        configFile: 'test/karma.conf.js',
        runnerPort: 9999,
        singleRun: false,
        browsers: ['Chrome']
      }
    },

    html2js: {
      main: {
        src: ['app/views/*.html'],
        dest: 'app/js/templates.js'
      },
    },

  });

  //CSS Min
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  //JSDoc
  grunt.loadNpmTasks('grunt-jsdoc');

  //uGLiFy
  grunt.loadNpmTasks('grunt-contrib-uglify');

  //Concatenate JS files
  grunt.loadNpmTasks('grunt-contrib-concat');

  //Unit E2E testing
  grunt.loadNpmTasks('grunt-karma');

  //Put all HTML files in one JS file
  grunt.loadNpmTasks('grunt-html2js');

  // Default task(s).
  grunt.registerTask('default', ['html2js', 'uglify', 'concat', 'karma:e2e', 'cssmin', 'jsdoc']);

};