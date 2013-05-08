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
          'app/js/min/app.js':  ['app/js/app.js'],
          'app/js/min/controllers.js': ['app/js/controllers.js'],
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
        src: ['app/js/min/app.js', 'app/js/min/controllers.js', 'app/js/min/localStorageModule.js', 'app/js/min/templates.js'],
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
        singleRun: true,
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