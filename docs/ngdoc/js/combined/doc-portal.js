angular.module('deeplink', [])

.run(['$rootScope', function ($rootScope) {
  function postUrlMessage(e) {
    var messageObj = {
      event: 'urlChange',
      data: {}
    };

    if (window.location.pathname.length > 1) {
      messageObj.data.p = window.location.pathname;
    }
    if (window.location.search.length > 0) {
      messageObj.data.s = window.location.search;
    }
    if (window.location.hash.length > 1) {
      messageObj.data.h = window.location.hash;
    }

    window.top.postMessage('l::' + JSON.stringify(messageObj), '*');
  }

  if (window.JSON) {
    window.addEventListener('load', postUrlMessage);
    window.addEventListener('hashchange', postUrlMessage);
    $rootScope.$on('$locationChangeSuccess', postUrlMessage);
  }
}]);