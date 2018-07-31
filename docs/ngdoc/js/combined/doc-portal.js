angular.module('deeplink', [])

.run(['$rootScope', '$location', function ($rootScope, $location) {
  function postUrlMessage(e) {
    var messageObj = {
      event: 'urlChange',
      data: {}
    };

    if ($location.path().length > 1) {
      messageObj.data.p = $location.path();
    }
    if (window.location.search.length > 0) {
      messageObj.data.s = window.location.search;
    }
    if ($location.hash().length > 1) {
      messageObj.data.h = $location.hash();
    }

    window.top.postMessage('l::' + JSON.stringify(messageObj), '*');
  }

  if (window.JSON) {
    window.addEventListener('load', postUrlMessage);
    window.addEventListener('hashchange', postUrlMessage);
    $rootScope.$on('$locationChangeSuccess', postUrlMessage);
  }
}]);
