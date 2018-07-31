angular.module('DocsController', [])

.controller('DocsController', [
          '$scope', '$rootScope', '$location', '$window', '$cookies', 'openPlunkr',
              'NG_PAGES', 'NG_NAVIGATION',
  function($scope, $rootScope, $location, $window, $cookies, openPlunkr,
              NG_PAGES, NG_NAVIGATION) {
  var NG_VERSION  = {};
  var defaultPage = 'learn/overview';
  var lastPage;

  $scope.openPlunkr = openPlunkr;

  $scope.docsVersion = NG_VERSION.isSnapshot ? 'snapshot' : NG_VERSION.version;

  $scope.navClass = function(navItem) {
    return {
      active: navItem.href && $scope.currentPage && $scope.currentPage.path,
      'nav-index-section': navItem.type === 'section'
    };
  };

  $scope.$on('$includeContentLoaded', function() {
    var pagePath = $scope.currentPage ? $scope.currentPage.path : $location.path();
    $window._gaq = $window._gaq || [];
    $window._gaq.push(['_trackPageview', pagePath]);
  });

  $scope.$on('$locationChangeStart', gotoPage);

  function gotoPage() {
    path = $location.path();
    path = path !== '' ? path : defaultPage;
    path = path.replace(/^\/?(.+?)(\/index)?\/?$/, '$1');

    $scope.currentPage = NG_PAGES[path];

    if (lastPage !== $scope.currentPage) {
      if ($scope.currentPage) {
        $scope.partialPath = 'partials/' + path + '.html';
        $scope.currentArea = NG_NAVIGATION[$scope.currentPage.area];
        var pathParts = $scope.currentPage.path.split('/');
        var breadcrumb = $scope.breadcrumb = [];
        var breadcrumbPath = '';
        angular.forEach(pathParts, function (part) {
          breadcrumbPath += part;
          breadcrumb.push({name: part, url: breadcrumbPath});
          breadcrumbPath += '/';
        });

        if ($scope.currentPage.path !== defaultPage) {
          $location.path(path);
        }
        lastPage = $scope.currentPage;
      } else {
        $scope.currentArea = NG_NAVIGATION['api'];
        $scope.breadcrumb = [];
        $scope.partialPath = 'Error404.html';
      }
    }
  }

  /**********************************
   Initialize
   ***********************************/

  $scope.versionNumber = angular.version.full;
  $scope.version = angular.version.full + "  " + angular.version.codeName;
  $scope.loading = 0;

  gotoPage($location.path());
}]);
