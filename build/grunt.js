import { gruntCustomizer, gruntOptionsMaker } from './options-customizer.js';
module.exports = function(grunt) {
  require('time-grunt')(grunt);

  let _ = require('lodash-compat');
  let pkg = grunt.file.readJSON('package.json');
  let versionParts = pkg.version.split('.');
  let version = {
    full: pkg.version,
    major: versionParts[0],
    minor: versionParts[1],
    patch: versionParts[2]
  };

  version.majorMinor = '${version.major}.${version.minor}';

  const browserifyGruntDefaults = {
    browserifyOptions: {
      debug: true,
      standalone: 'emp-receiver-demo-app'
    },
    plugin: [
      ['browserify-derequire']
    ],
    transform: [
      require('babelify').configure({
        sourceMapRelative: './',
        loose: ['all']
      }),
      ['browserify-versionify', {
        placeholder: '__VERSION__',
        version: pkg.version
      }],
      ['browserify-versionify', {
        placeholder: '__VERSION_NO_PATCH__',
        version: version.majorMinor
      }]
    ]
  };

  const browserifyGruntCustomizer = gruntCustomizer;
  const browserifyGruntOptions = gruntOptionsMaker(browserifyGruntDefaults, browserifyGruntCustomizer);

  grunt.initConfig({
    pkg,
    clean: {
      build: ['build/temp/*', 'dist/*'],
      npm: ['emp-chromecast-receiver-2-dev/'],
    },
    browserify: {
      options: browserifyGruntOptions(),
      build: {
        files: {
          'build/temp/emp-receiver-demo-app.js': ['app/js/emp-receiver-demo-app.js']
        }
      }
    },
    uglify: {
      build: {
        options: {
          preserveComments: false,
          mangle: true,
          compress: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            drop_console: true
          }
        },
        files: {
          'build/temp/emp-receiver-demo-app.min.js': 'build/temp/emp-receiver-demo-app.js'
        }
      }
    },
    copy: {
      build:    {
        files: [
          { cwd: 'app/images/', src: ['*.*'], dest: 'dist/images', expand: true, filter: 'isFile'  },
          { cwd: 'app/', src: ['index.html'], dest: 'dist', expand: true, filter: 'isFile' },
          { cwd: 'app/css/', src: ['*.css'], dest: 'dist/css', expand: true, filter: 'isFile' },
          { cwd: 'app/js/', src: ['emp-player.*'], dest: 'dist/js', expand: true, filter: 'isFile' },
          { cwd: 'app/js/', src: ['video.*'], dest: 'dist/js', expand: true, filter: 'isFile' },
          { cwd: 'app/js/', src: ['emp-shaka.*'], dest: 'dist/js', expand: true, filter: 'isFile' },
          { cwd: 'app/js/', src: ['emp-hls-mse.*'], dest: 'dist/js', expand: true, filter: 'isFile' },
          { cwd: 'build/temp/', src: ['*.*'], dest: 'dist/js', expand: true, filter: 'isFile' }
        ]
      },
      fromNPM: {
        files: [
          { cwd: 'node_modules/emp-chromecast-receiver-2-dev/dist/js/', src: ['!emp-receiver*.*', 'emp-player*.*', 'emp-shaka*.*', 'emp-hls-mse.*'], dest: 'app/js', expand: true, filter: 'isFile' },
          { cwd: 'node_modules/emp-chromecast-receiver-2-dev/dist/video-js/', src: ['video*.js'], dest: 'app/js', expand: true, filter: 'isFile' },
          { cwd: 'node_modules/emp-chromecast-receiver-2-dev/dist/video-js/', src: ['video*.css'], dest: 'app/css', expand: true, filter: 'isFile' },
          { cwd: 'node_modules/emp-chromecast-receiver-2-dev/dist/css/', src: ['*.*'], dest: 'app/css', expand: true, filter: 'isFile' },
          { cwd: 'node_modules/emp-chromecast-receiver-2-dev/', src: ['*.md'], dest: '.', expand: true, filter: 'isFile' },
          { cwd: 'node_modules/emp-chromecast-receiver-2-dev/dist/tutorials', src: ['*.*'], dest: 'tutorials', expand: true, filter: 'isFile' }
        ]
      },
      docs: { cwd: 'node_modules/emp-chromecast-receiver-2-dev/dist/docs', src: ['**/**'], dest: 'dist/docs/', expand: true, filter: 'isFile' },
    },
    ftpush: {
      stage: {
        auth: {
          host: 'waws-prod-am2-121.ftp.azurewebsites.windows.net',
          port: 21,
          authKey: 'chromecast-azure-stage'
        },
        src: 'dist/',
        dest: "/site/wwwroot/chromecast-demo-receiver/stage/"
      },
      prod: {
        auth: {
          host: 'waws-prod-am2-121.ftp.azurewebsites.windows.net',
          port: 21,
          authKey: 'chromecast-azure-stage'
        },
        src: 'dist/',
        dest: "/site/wwwroot/chromecast-wla-receiver/"
      }
    },
    zip: {
      build: {
        cwd: './dist',
        src: [ 'dist/**/*' ],
        dest: 'dist/emp-chromecast-demo-receiver-' + version.full + '.zip'
      }
    },
    shell: {
      updateNPM: {
        command: 'npm install emp-chromecast-receiver-2-dev latest',
        options: {
          preferLocal: true
        }
      }
    }
  });




  // load all the npm grunt tasks
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('chg');

  grunt.registerTask('build', [
    'clean:build',
    'browserify:build',
    'uglify:build',
    'copy:build',
    'copy:docs'
  ]);


  grunt.registerTask('default', ['build']);
  grunt.registerTask('deploy', ['build', 'ftpush:stage']);
  grunt.registerTask('production', ['build', 'ftpush:prod']);
  grunt.registerTask('update', ['shell:updateNPM', 'copy:fromNPM']);
  grunt.loadTasks('build/tasks');
};
