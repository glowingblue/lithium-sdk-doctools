angular.module('docsApp', [
  'ngRoute',
  'ngCookies',
  'ngSanitize',
  'ngAnimate',
  'DocsController',
  'pagesData',
  'navData',
  'directives',
  'errors',
  'examples',
  'search',
  'tutorials',
  'bootstrap',
  'versions',
  'ui.bootstrap.dropdown',
  'deeplink'
])

.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');
}]);
