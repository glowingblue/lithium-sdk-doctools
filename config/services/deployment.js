"use strict";

var cdnUrl = "//ajax.googleapis.com/ajax/libs/angularjs/1.2.19";

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

module.exports = function defaultDeployment() {
  return {
    name: 'default',
    examples: {
      commonFiles: {
        scripts: [ 
          cdnUrl + '/angular.min.js',
          '/js/app.js'
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
      'https://google-code-prettify.googlecode.com/svn/loader/prettify.js',
      'https://google-code-prettify.googlecode.com/svn/loader/lang-css.js',
      '/components/' + getComponentWithVersion('marked') + '/marked.js',
      '/components/' + getComponentWithVersion('lunr') + '/lunr.min.js',
      '/js/angular-bootstrap/bootstrap.min.js',
      '/js/angular-bootstrap/dropdown-toggle.min.js',
      '/js/pages-data.js',
      '/js/nav-data.js',
      '/js/docs.min.js'
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