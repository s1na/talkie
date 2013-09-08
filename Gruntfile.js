
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
        src: 'public/js/src/*.js',
        dest: 'public/js/main.min.js'
      }
    },
    nodemon: {
      dev: {
        options: {
          file: 'talkie.js',
          ignoredFiles: ['README.md', 'node_modules/**'],
          watchedExtensions: ['js'],
          watchedFolders: ['public', 'routes', 'views'],
          debug: true,
          delayTime: 1,
          env: {
            PORT: 3000,
          },
          cwd: __dirname
        }
      },
      prod: {
        options: {
          file: 'talkie.js',
          args: ['production'],
          env: {
            PORT: 80,
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
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('default', ['jshint', 'nodemon']); // 'uglify'
  grunt.registerTask('production', ['nodemon:prod']);

};
