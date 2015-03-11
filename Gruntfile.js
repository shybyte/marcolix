module.exports = function (grunt) {
  var grunt_config = {
    watch: {
      html: {
        options: {
          livereload: true
        },
        files: 'client/**/*.html'
      },
      less: {
        options: {
          livereload: true
        },
        files: 'client/styles/**/*.less',
        tasks: 'less:dev'
      },
      typescript: {
        options: {
          atBegin: true,
          livereload: true
        },
        files: ['client/**/*.ts'],
        tasks: 'typescript'
      }
    },

    less: {
      dev: {
        options: {
          paths: ['client/styles']
        },
        files: {
          ".tmp/compiled/styles.css": ['client/styles/*.less']
        }
      }
    },

    typescript: {
      base: {
        src: ['client/scripts/**/*.ts'],
        dest: '.tmp/compiled/client.js',
        options: {
          target: 'es5',
          sourceMap: true
        }
      }
    },

    nodemon: {
      dev: {
        script: 'server/server.js',
        options: {
          watch: ['server/**/*']
        }
      }
    },

    concurrent: {
      tasks: ['nodemon', 'watch'],
      options: {
        logConcurrentOutput: true
      }
    },

    bower: {
      options: {
        copy: false
      },
      install: {}
    }

  };

  grunt.initConfig(grunt_config);

  require('jit-grunt')(grunt, {bower: 'grunt-bower-task'});

  grunt.registerTask('default', ['build', 'serve']);
  grunt.registerTask('build', ['bower:install', 'less:dev']);
  grunt.registerTask('serve', ['concurrent']);
};
