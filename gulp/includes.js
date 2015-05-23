"use strict";

var log = require('gulp-util').log;
var concat = require('gulp-concat');
var Dgeni = require('dgeni');
var merge = require('event-stream').merge;
var path = require('canonical-path');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var connect = require('gulp-connect');
var historyApiFallback = require('connect-history-api-fallback');
var del = require('del');
var through = require('through2').obj;
var sdkConf = require(path.resolve(process.cwd(), 'sdk.conf.json'));

function getPrettyEscapedContent(templateContent) {
  return templateContent
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/\r?\n/g, '\\n\' +\n    \'');
}

var HTML2JS_TEMPLATE = 'angular.module(\'<%= moduleName %>\').run([\'$templateCache\', function($templateCache) {\n' +
    '  $templateCache.put(\'<%= url %>\',\n    \'<%= prettyEscapedContent %>\');\n' +
    '}]);\n';

// We indicate to gulp that tasks are async by returning the stream.
// Gulp can then wait for the stream to close before starting dependent tasks.
// See clean and bower for async tasks, and see assets and doc-gen for dependent tasks below
module.exports = function(gulp, gutil) {

  var outputFolder = 'dist-ngdoc';

  var docAppSrc = 'docs/app/src/**/*.js';
  var docAppAssets = 'docs/app/assets/**/!(*.js)';
  var docAppAssetsJs = 'docs/app/assets/**/*.js';

  var copyComponent = function(component, pattern, sourceFolder, packageFile) {
    pattern = pattern || '/**/*';
    sourceFolder = sourceFolder || 'node_modules';
    packageFile = packageFile || 'package.json';
    var version;
    try {
      version = require(path
          .resolve(__dirname, '..', sourceFolder,component,packageFile)).version;
    } catch (err) {
    }
    return gulp
      .src(path.join(__dirname, '..', sourceFolder, component, pattern))
      .pipe(gulp.dest('./' + outputFolder + '/components/' + 
          component + (version ? '-' + version : '')));
  };

  gulp.task('ngdoc-clean', function (cb) {
    del(outputFolder, cb);
  });

  gulp.task('ngdoc-app', ['ngdoc-clean'], function() {
    var file = 'docs.js';
    var minFile = 'docs.min.js';
    var folder = outputFolder + '/js/';

    return gulp.src(docAppSrc)
      .pipe(sourcemaps.init())
      .pipe(concat(file))
      .pipe(gulp.dest(folder))
      .pipe(rename(minFile))
      .pipe(uglify())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(folder));
  });

  gulp.task('ngdoc-src', ['ngdoc-clean'], function (cb) {
    if (sdkConf.ng) {
      var dependencies = sdkConf.ng.moduleDependencies;
      delete(dependencies.ng);
      var appSrc = [];
      Object.getOwnPropertyNames(dependencies)
      .forEach(function (key) {
        dependencies[key].forEach(function (dep) {
          appSrc.push(path.join('bower_components', dep));
        });
      })
      appSrc.push('src/**/!(*.demo|*.spec|*.mock).js');
      appSrc.push('src/directives/**/!(*.demo).tpl.html');
      return gulp.src(appSrc)
        .pipe(through(function (file, enc, cb) {
          if(/\.tpl\.html$/.test(file.relative)) {
            file.contents = new Buffer(gutil.template(HTML2JS_TEMPLATE)({
              moduleName: (function () {
                var parts = file.path.split('/');
                return [
                  gutil.env.ng.module,
                  'directives',
                  parts[parts.length - 3],
                  parts[parts.length - 2]
                ].join('.');
              })(),
              prettyEscapedContent: getPrettyEscapedContent(String(file.contents)),
              file: file,
              url: file.path.substr(path.join(file.cwd, 'src', 'directives').length + 1)
            }));
            file.path = gutil.replaceExtension(file.path, '.js');
            file.base = path.join(file.cwd, 'src');
          }
          this.push(file);
          cb();
        }))
        .pipe(concat('app.js'))
        .pipe(gulp.dest(outputFolder + '/js/'));
    } else {
      cb();
    }
  });

  gulp.task('ngdoc-assets', ['ngdoc-clean'], function() {
    var JS_EXT = /\.js$/;
    return merge(
      gulp.src(['docs/images/**/*']).pipe(rename({dirname: ''}))
        .pipe(gulp.dest(outputFolder + '/img')),
      gulp.src(docAppAssets).pipe(gulp.dest(outputFolder)),
      gulp.src(docAppAssetsJs)
        .pipe(sourcemaps.init())
        .pipe(through(function (file, enc, cb) {
          file.path = file.path.replace(JS_EXT, '.min.js');
          file.realtive = file.relative.replace(JS_EXT, '.min.js');
          this.push(file);
          cb();
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(outputFolder)),
      copyComponent('bootstrap', '/dist/**/*'),
      copyComponent('open-sans-fontface','/**/*'),
      copyComponent('lunr','/lunr.min.js'),
      copyComponent('marked', '/lib/marked.js')
    );
  });

  gulp.task('ngdoc-dgeni', ['ngdoc-clean'], function() {
    var dgeni = new Dgeni([require('../config')(outputFolder)]);
    return dgeni.generate().catch(function(error) {
      process.exit(1);
    });
  });

  // The default task that will be run if no task is supplied
  gulp.task('ngdoc-build', ['ngdoc-assets', 'ngdoc-dgeni', 'ngdoc-app', 'ngdoc-src']);

  gulp.task('ngdoc-reload', ['ngdoc-build'], function () {
    return gulp.src(outputFolder + '/index.html').pipe(connect.reload());
  });

  gulp.task('ngdoc-server', ['ngdoc-build'], function() {
    var serverPort;
    try {
      serverPort = sdkConf.ngdoc.serverPort;
    } catch (err) {}
    if (!serverPort) {
      serverPort = 9100;
      gutil.log(gutil.colors.yellow('Docserver port is not set in sdk.conf.json, ' +
          'using default port 9100'));
    }
    var lrPort;
    try {
      lrPort = require(path.resolve(process.cwd(), 
          'sdk.conf.json')).ngdoc.lrPort;
    } catch (err) {}
    if (!lrPort) {
      lrPort = 35729;
      gutil.log(gutil.colors.yellow('Live reload port is not set in sdk.conf.json, ' +
          'using default port 35729'));
    }
    connect.server({
      root: outputFolder,
      port: serverPort,
      livereload: {
        port: lrPort
      },
      middleware: function(connect, opt) {
        return [ historyApiFallback ];
      }
    });
    gulp.watch(['docs/**/*','src/**/*.js'], ['ngdoc-reload']);
  });
};