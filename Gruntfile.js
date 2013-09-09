
module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Grunfile.js', 'talkie.js', 'public/js/*.js', 'routes/*.js'],
      options: {
        globals: {
          'angular': true,
          '_': true,
          'console': true,
          'window': true,
          'document': true
        }
      }
    },
    uglify: {
      build: {
        files: {
          'public/js/prod.min.js': ['public/js/*.js', '!public/js/prod.min.js']
        }
      }
    },
    less: {
      production: {
        options: {
          paths: ['public/css'],
          yuicompress: true
        },
        files: [
          {
            expand: true,
            cwd: 'public/',
            src: ['css/*.less'],
            dest: 'public/',
            ext: '.css'
          }
        ]
      }
    },
    ngmin: {
      lib: {
        src: 'public/lib/angular-socket-io/socket.js',
        dest: 'public/js/angular-socket-io.js'
      }
    },
    nodemon: {
      dev: {
        options: {
          file: 'talkie.js',
          args: ['--development'],
          ignoredFiles: ['README.md', 'node_modules/**'],
          watchedExtensions: ['js'],
          watchedFolders: ['public', 'routes', 'views'],
          debug: true,
          delayTime: 1,
          env: {
            PORT: 3000,
            development: true,
          },
          cwd: __dirname
        }
      },
      prod: {
        options: {
          file: 'talkie.js',
          args: ['--production'],
          env: {
            PORT: 80,
            development: false,
          },
          cwd: __dirname
        }
      },
      exec: {
        options: {
          exec: 'less',
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-ngmin');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('default', ['jshint', 'nodemon']);
  grunt.registerTask('production', ['less', 'ngmin:lib', 'uglify', 'nodemon:prod']);

};
