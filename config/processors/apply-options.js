var exec = require('child_process').exec;

module.exports = function (opts) {
  return function applyOptionshProcessor (log) {
    return {
      $runAfter: ['memberDocsProcessor'],
      $runBefore: ['rendering-docs'],
      $process: function(docs) {
        docs.forEach(function (doc) {
          doc.gitBranch = opts.gitBranch;
          doc.pathPrefix = opts.pathPrefix;
        });
      }
    };
  };
};
