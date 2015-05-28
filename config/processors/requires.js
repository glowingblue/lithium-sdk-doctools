var exec = require('child_process').exec;
var fs = require('fs');
var uglifyJs = require('uglify-js');

var module_declaration = /angular\.module\((.*?)\)/gi;

module.exports = function exampleSrcProcessor (log) {
  return {
    $runAfter: ['files-read'],
    $runBefore: ['processing-docs'],
    $process: function(docs) {
      var docToRequires = [];
      var ngModuleToDoc = {};
      docs.forEach(function (doc) {
        if(doc.docType === 'directive' || doc.docType === 'service' 
            || doc.docType === 'filter') {
          try {
            var contents = uglifyJs.minify(doc.fileInfo.filePath, {
              compress: false, 
              mangle: false
            });

            var req = [];
            while((results = module_declaration.exec(contents.code)) !== null) {
              var parts = JSON.parse('[' + results[1] + ']');
              var module = parts[0];
              var dependencies = parts[1];
              req = req.concat(dependencies);
              if (ngModuleToDoc[module]) {
                ngModuleToDoc[module].push(doc.module + '.' + doc.name);
              } else {
                ngModuleToDoc[module] = [doc.module + '.' + doc.name];
              }
            }
            if (req.length > 0) {
              docToRequires.push({
                doc: doc,
                requires: req
              });
            }
          } catch (err) {
            log.error(err.message);
          }
        }
      });
      docToRequires.forEach(function (entry) {
        var requires = [];
        entry.requires.forEach(function (req) {
          if (ngModuleToDoc[req] && ngModuleToDoc[req].length > 0) {
            requires = requires.concat(ngModuleToDoc[req]);
          }
        });
        entry.doc.requires = (entry.doc.requires || []).concat(requires);
        entry.doc.requires = entry.doc.requires.filter(function (item, pos) {
          return entry.doc.requires.indexOf(item) === pos;
        });
      });
    }
  }
};
