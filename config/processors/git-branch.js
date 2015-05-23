var exec = require('child_process').exec;

module.exports = function addGitBranchProcessor (log) {
  return {
    $runAfter: ['memberDocsProcessor'],
    $runBefore: ['rendering-docs'],
    $process: function(docs) {
      exec('git rev-parse --abbrev-ref HEAD', function (error, stdout, stderror) {
        var branch = 'master';
        if (error) {
          log.error(stderror)
        } else {
          branch = stdout;
        }
        docs.forEach(function (doc) {
          doc.gitBranch = branch;
        });
      });
    }
  }
};
