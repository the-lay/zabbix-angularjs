module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), //package information

    uglify: { //minification
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        report: 'gzip'
      },
      build: {
        files: {
          'app/js/min/app.js':  ['app/js/app.js'],
          'app/js/min/controllers.js': ['app/js/controllers.js'],
          'app/js/min/localStorageModule.js': ['app/js/localStorageModule.js']
        }
      }
    },

    jsdoc: { //documentation for JS files
      src: ['app/js/*.js'],
      options: {
        destination: 'docs'
      }
    },

    concat: { //concatenate JS files
      dist: {
        src: ['app/js/min/app.js', 'app/js/min/controllers.js', 'app/js/min/localStorageModule.js'],
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

    jshint:{ //lint JS files
      options:{
        strict: true,
        jquery: true,
        globals:{
          angular:true
        },
      },
      files: ['app/js/app.js', 'app/js/controllers.js', 'app/js/localStorageModule.js']
    },

    watch: { //watch for changes
      files: 'app/js/*.js',
      tasks: ['uglify', 'concat']
    },

    karma: { //run E2E tests
      unit: {
        configFile: 'test/karma.conf.js',
        runnerPort: 9999,
        singleRun: true,
        browsers: ['PhantomJS']
      }
    }

  });

  //CSS Min
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  //JSHint validation
  grunt.loadNpmTasks('grunt-contrib-jshint');

  //JSDoc
  grunt.loadNpmTasks('grunt-jsdoc');

  //uGLiFy
  grunt.loadNpmTasks('grunt-contrib-uglify');

  //Concatenate JS files
  grunt.loadNpmTasks('grunt-contrib-concat');

  //Watch for changes
  grunt.loadNpmTasks('grunt-contrib-watch');

  //Unit E2E testing
  grunt.loadNpmTasks('grunt-karma');


  // Default task(s).
  grunt.registerTask('default', ['karma', 'cssmin', 'jsdoc', 'uglify', 'concat']); //not using watch, jshint

};