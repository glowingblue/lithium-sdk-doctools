var exec = require('child_process').exec;
var fs = require('fs');

module.exports = function exampleSrcProcessor (log, exampleMap) {
  return {
    $runAfter: ['files-read'],
    $runBefore: ['parsing-tags'],
    $process: function() {
      exampleMap.forEach(function (example, key) {
        var path = example.doc.fileInfo.relativePath.split('/');
        path.pop();
        path.unshift('li');
        example.module = path.join('.');

        Object.getOwnPropertyNames(example.files).forEach(function (fileName) {
          if (example.files[fileName].src) {
            try {
              //Can not us readFile hence using readFileSync
              example.files[fileName].fileContents = 
                fs.readFileSync(example.files[fileName].src, {
                  encoding: 'utf8'
                });
            } catch (err) {
              log.error(err);
            }
          }
        })
      });
    }
  }
};
