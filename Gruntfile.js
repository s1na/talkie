
module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      //jshintrc: '.jshintrc',
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
          'public/js/prod.min.js': ['public/js/*.js', '!public/js/prod.min.js', 'public/lib/angular-socket-io/socket.js']
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
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('default', ['jshint', 'nodemon']);
  grunt.registerTask('production', ['less', 'uglify', 'nodemon:prod']);

};
