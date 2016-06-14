"use strict";

var cdnUrl = "//ajax.googleapis.com/ajax/libs/angularjs/1.5.6";

var path = require('canonical-path');
var basePath = path.resolve(__dirname, '../..');

function getComponentWithVersion(component, sourceFolder, packageFile) {
  sourceFolder = path.resolve(__dirname, '../..', 'node_modules');
  packageFile = packageFile || 'package.json';
  var version;
  try {
    version = require(path
          .resolve(__dirname, '..', sourceFolder, component, packageFile)).version;
  } catch (err) {
  }
  return version ? component + '-' + version : component;
}

module.exports = function (opts) {
  return function defaultDeployment() {
    return {
      name: 'default',
      examples: {
        commonFiles: {
          scripts: [
            cdnUrl + '/angular.min.js',
            '/' + opts.pathPrefix + 'js/app.js'
          ],
          stylesheets: [
            '/' + opts.pathPrefix + 'css/example.css'
          ]
        },
        dependencyPath: cdnUrl + '/'
      },
      scripts: [
        cdnUrl + '/angular.min.js',
        cdnUrl + '/angular-resource.min.js',
        cdnUrl + '/angular-route.min.js',
        cdnUrl + '/angular-cookies.min.js',
        cdnUrl + '/angular-sanitize.min.js',
        cdnUrl + '/angular-touch.min.js',
        cdnUrl + '/angular-animate.min.js',
        // 'https://google-code-prettify.googlecode.com/svn/loader/prettify.js',
        // 'https://google-code-prettify.googlecode.com/svn/loader/lang-css.js',
        'https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js',
        '/' + opts.pathPrefix + 'components/' + getComponentWithVersion('marked') + '/marked.js',
        '/' + opts.pathPrefix + 'components/' + getComponentWithVersion('lunr') + '/lunr.min.js',
        '/' + opts.pathPrefix + 'js/angular-bootstrap/bootstrap.min.js',
        '/' + opts.pathPrefix + 'js/angular-bootstrap/dropdown-toggle.min.js',
        '/' + opts.pathPrefix + 'js/pages-data.js',
        '/' + opts.pathPrefix + 'js/nav-data.js',
        '/' + opts.pathPrefix + 'js/docs.min.js'
      ],
      stylesheets: [
        'components/' + getComponentWithVersion('bootstrap') + '/css/bootstrap.min.css',
        'components/' + getComponentWithVersion('open-sans-fontface') + '/open-sans.css',
        'css/prettify-theme.css',
        'css/docs.css',
        'css/animations.css'
      ]
    };
  };
};
