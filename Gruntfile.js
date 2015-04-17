module.exports = function (grunt) {
  var grunt_config = {
    watch: {
      html: {
        options: {
          livereload: true
        },
        files: 'client/**/*.html'
      },
      tests: {
        options: {
          livereload: true
        },
        files: 'tests/client/**/*'
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
        files: ['client/**/*.ts', 'shared/**/*.ts'],
        tasks: 'typescript:client'
      },
      typescriptServer: {
        options: {
          atBegin: true,
          livereload: true
        },
        files: ['server/**/*.ts', 'shared/**/*.ts', 'tests/server**/*.ts'],
        tasks: 'typescript:server'
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
      client: {
        src: ['client/scripts/**/*.ts', 'shared/**/*.ts'],
        dest: '.tmp/compiled/client.js',
        options: {
          target: 'es5',
          sourceMap: false
        }
      },
      server: {
        src: ['server/**/*.ts', 'shared/**/*.ts','tests/server/**/*.ts'],
        dest: '.tmp/compiled',
        options: {
          basePath: '',
          target: 'es5',
          module: 'commonjs'
          //sourceMap: true
        }
      }


    },

    nodemon: {
      dev: {
        script: './.tmp/compiled/server/server.js',
        options: {
          watch: ['./.tmp/compiled/server']
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
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['tests/server/**/*.js']
      }
    }

  };

  grunt.initConfig(grunt_config);

  require('jit-grunt')(grunt, {bower: 'grunt-bower-task'});

  grunt.registerTask('default', ['build', 'serve']);
  grunt.registerTask('build', ['bower:install', 'less:dev','mochaTest']);
  grunt.registerTask('serve', ['concurrent']);
  grunt.registerTask('watch-ts-server', ['watch:typescriptServer']);

  grunt.registerTask('ts', ['typescript:server']);
};
