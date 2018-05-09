"use strict";

const colors = require('ansi-colors');
const concat = require('gulp-concat');
const connect = require('gulp-connect');
const del = require('del');
const Dgeni = require('dgeni');
const exec = require('child_process').exec;
const historyApiFallback = require('connect-history-api-fallback');
const log = require('fancy-log');
const merge = require('event-stream').merge;
const open = require('open');
const path = require('canonical-path');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');
const through = require('through2').obj;
const webpack = require('webpack-stream');
const uglify = require('gulp-uglify');

module.exports = (gulp) => {

  const DOC_OUTPUT_FOLDER = 'docs/buildTest/ngdoc';

  var copyComponent = function(component, 
                               pattern = '/**/*', 
                               sourceFolder = 'node_modules', 
                               packageFile = 'package.json') {

    var version;

    try {
      version = require(path.resolve(__dirname, 
                                    '..', 
                                    sourceFolder,
                                    component,
                                    packageFile)).version;
    } catch (err) {
      
    }
    console.log(`copyComponent: ${sourceFolder}/${component} -> ` +
                `${DOC_OUTPUT_FOLDER}/components/${component}${version ? '-' + version : ''}`);
       
    return gulp
      .src(path.join(__dirname, '..', sourceFolder, component, pattern))
      .pipe(gulp.dest(DOC_OUTPUT_FOLDER + '/components/' + 
          component + (version ? '-' + version : '')));
  };

  gulp.task('ngdoc-clean-docs', [], (cb) => {
    del(DOC_OUTPUT_FOLDER, cb);
  });

  // take js deps that dgeni needs and bundle them up
  /*
  gulp.task('client-js-deps', () => {

    const dependencies = [
      // once we confirm the bower_components js works, move to node_modules
      // 'node_modules/lunr/lunr.min.js',
      // 'node_modules/marked/marked.min.js',
      'bower_components/lunr.js/lunr.min.js',
      'bower_components/marked/lib/marked.js',
    ];

    return gulp.src(dependencies)
    .pipe(webpack({
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          }
        ]
      },
      plugins: [
        function () {
          // when webpack finishes, grab the hash and add it to the html index
          // https://github.com/webpack/webpack/issues/86#issuecomment-179957661
          this.plugin('done', (statsData) => {
            console.log('DONE!');
            let stats = statsData.toJson();
            if (!stats.errors.length) {
              console.log(stats.assetsByChunkName);
              // return gulp.src('path_to_index.html')
              //   .pipe(replace('JS_BUNDLE_HASH', stdout))
              //   .pipe(gulp.dest());
            }
          });
        }
      ]
    }))
    .pipe(gulp.dest(DOC_OUTPUT_FOLDER));

  });
  */

  gulp.task('ngdoc-app', ['ngdoc-clean-docs'], function() {
    const JS_EXT = /\.js$/;

    const docJsCombined = 'docs/ngdoc/js/combined/**/*.js';
    const docJsStandalone = 'docs/ngdoc/js/standalone/**/*.js';
    const docCss = 'docs/ngdoc/css/**/*.css';
    const docImg = 'docs/ngdoc/images/**/*';

    return merge(

      gulp.src(docJsCombined)
        .pipe(sourcemaps.init())
        .pipe(concat('docs.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(DOC_OUTPUT_FOLDER + '/js')),

      gulp.src(docJsStandalone)
        .pipe(sourcemaps.init())
        .pipe(through(function (file, enc, cb) {
          file.path = file.path.replace(JS_EXT, '.min.js');
          file.realtive = file.relative.replace(JS_EXT, '.min.js');
          this.push(file);
          cb();
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(DOC_OUTPUT_FOLDER + '/js')),

      gulp.src(docImg)
        .pipe(rename({dirname: ''}))
        .pipe(gulp.dest(DOC_OUTPUT_FOLDER + '/img')),

      gulp.src(docCss).pipe(gulp.dest(DOC_OUTPUT_FOLDER + '/css')),

      copyComponent('bootstrap', '/dist/**/*'),
      copyComponent('open-sans-fontface','/**/*'),
      copyComponent('lunr','/lunr.min.js'),
      copyComponent('marked', '/lib/marked.js')
    );
  });

  gulp.task('ngdoc-dgeni', ['ngdoc-clean-docs'], function() {
    var dgeni = new Dgeni([require('../config')({
      outputFolder: DOC_OUTPUT_FOLDER, 
      gitBranch: 'master', 
      pathPrefix: ''
    })]);
    return dgeni.generate().catch(function(error) {
      process.exit(1);
    });
  });

  gulp.task('ngdoc-build', ['ngdoc-app', 'ngdoc-dgeni']);

  // get the current version to put in the website footer so we know what version we're on
  // Apologies for the poor name on this task. We need to run AFTER the rest of the 
  // build steps so it is modifying the final index.html file.
  gulp.task('ngdoc-post-build', ['ngdoc-build'], () => {
    exec('git rev-parse HEAD', function (error, stdout, stderror) {
      if (error) {
        log(colors.yellow(stderror));
        log(colors.yellow('`git rev-parse HEAD` failed'));
      } else {
        log('git rev-parse HEAD - ' + stdout);
        return gulp.src(DOC_OUTPUT_FOLDER + '/index.html')
          .pipe(replace('GIT_REVISION_HEAD_TOKEN', stdout.trim()))
          .pipe(gulp.dest(DOC_OUTPUT_FOLDER));
      }
    }); 
  });

  gulp.task('ngdoc-reload', ['ngdoc-post-build'], function () {
    return gulp.src(DOC_OUTPUT_FOLDER + '/index.html').pipe(connect.reload());
  });

  gulp.task('ngdoc-server', ['ngdoc-post-build'], function() {
    let serverPort;
    try {
      serverPort = sdkConf.ngdoc.serverPort;
    } catch (err) {}
    if (!serverPort) {
      serverPort = 9100;
      log(colors.yellow('Docserver port is not set in sdk.conf.json, ' +
          'using default port 9100'));
    }
    let lrPort;
    try {
      lrPort = require(path.resolve(process.cwd(), 
          'sdk.conf.json')).ngdoc.lrPort;
    } catch (err) {}
    if (!lrPort) {
      lrPort = 35729;
      log(colors.yellow('Live reload port is not set in sdk.conf.json, ' +
          'using default port 35729'));
    } 
    let server = connect.server({
      root: DOC_OUTPUT_FOLDER,
      port: serverPort,
      livereload: {
        port: lrPort
      },
      middleware: function(connect, opt) {
        var middlewares = [];
        middlewares.push(historyApiFallback());
        return middlewares;
      }
    });
    open('http://localhost:' + serverPort);
    gulp.watch(['docs/ngdoc/**/*','src/**/*.js'], ['ngdoc-reload2']);
  });

  gulp.task('ngdoc', ['ngdoc-server']);

}

