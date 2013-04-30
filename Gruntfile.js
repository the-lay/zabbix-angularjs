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
          'app/js/app.min.js':  ['app/js/app.js'],
          'app/js/controllers.min.js': ['app/js/controllers.js'],
          'app/js/localStorageModule.min.js': ['app/js/localStorageModule.js']
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
        src: ['app/js/app.min.js', 'app/js/controllers.min.js', 'app/js/localStorageModule.min.js'],
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

    jshint:{
      options:{
        strict: true,
        jquery: true,
        globals:{
          angular:true
        },
      },
      files: ['app/js/app.js', 'app/js/controllers.js', 'app/js/localStorageModule.js']
    },


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




  // Default task(s).
  grunt.registerTask('default', ['cssmin', 'uglify', 'concat']);

};