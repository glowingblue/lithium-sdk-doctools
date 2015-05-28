// Canonical path provides a consistent path (i.e. always forward slashes) across different OSes
var path = require('canonical-path');
var packagePath = __dirname;

var Package = require('dgeni').Package;

// Create and export a new Dgeni package called dgeni-example. This package depends upon
// the jsdoc and nunjucks packages defined in the dgeni-packages npm module.
module.exports = function (opts) {
  return new Package('angularjs', [
    require('dgeni-packages/ngdoc'),
    require('dgeni-packages/nunjucks'),
    require('dgeni-packages/examples')
  ])

  .factory(require('./services/deployment')(opts))
  .factory(require('./inline-tag-defs/type'))

  .processor(require('./processors/index-page'))
  .processor(require('./processors/keywords'))
  .processor(require('./processors/pages-data'))
  .processor(require('./processors/apply-options')(opts))
  .processor(require('./processors/example-src'))
  .processor(require('./processors/requires'))

  // Configure our dgeni-example package. We can ask the Dgeni dependency injector
  // to provide us with access to services and processors that we wish to configure
  .config(function(dgeni, log, readFilesProcessor, templateFinder, writeFilesProcessor) {

    dgeni.stopOnValidationError = true;
    dgeni.stopOnProcessingError = true;

    // Set logging level
    log.level = 'info';

    // Specify the base path used when resolving relative paths to source and output files
    readFilesProcessor.basePath = process.cwd();

    // Specify collections of source files that should contain the documentation to extract
    readFilesProcessor.sourceFiles = [
      {
        include: 'src/**/*.js',
        basePath: 'src'
      },
      { 
        include: path.resolve(process.cwd(), 'docs/content/**/*.ngdoc'), 
        basePath: path.resolve(process.cwd(), 'docs/content')
      }
    ];

    // Specify where the writeFilesProcessor will write our generated doc files
    writeFilesProcessor.outputFolder = path.resolve(process.cwd(), opts.outputFolder);
  })

  .config(function(parseTagsProcessor) {
    parseTagsProcessor.tagDefinitions.push(require('./tag-defs/tutorial-step'));
    parseTagsProcessor.tagDefinitions.push(require('./tag-defs/sort-order'));
    parseTagsProcessor.tagDefinitions.push(require('./tag-defs/contract'));
    parseTagsProcessor.tagDefinitions.push(require('./tag-defs/image'));
  })

  .config(function(inlineTagProcessor, typeInlineTagDef) {
    inlineTagProcessor.inlineTagDefinitions.push(typeInlineTagDef);
  })

  .config(function(templateFinder) {
    templateFinder.templateFolders.unshift('./docs/templates');
  })

  .config(function(computePathsProcessor, computeIdsProcessor) {

    computePathsProcessor.pathTemplates.push({
      docTypes: ['error'],
      pathTemplate: 'error/${namespace}/${name}',
      outputPathTemplate: 'partials/error/${namespace}/${name}.html'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['errorNamespace'],
      pathTemplate: 'error/${name}',
      outputPathTemplate: 'partials/error/${name}.html'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['overview', 'tutorial'],
      getPath: function(doc) {
        var docPath = path.dirname(doc.fileInfo.relativePath);
        if ( doc.fileInfo.baseName !== 'index' ) {
          docPath = path.join(docPath, doc.fileInfo.baseName);
        }
        return docPath;
      },
      outputPathTemplate: 'partials/${path}.html'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['e2e-test'],
      getPath: function() {},
      outputPathTemplate: 'ptore2e/${example.id}/${deployment.name}_test.js'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['indexPage'],
      pathTemplate: '.',
      outputPathTemplate: '${id}.html'
    });

    computePathsProcessor.pathTemplates.push({
      docTypes: ['module' ],
      pathTemplate: '${area}/${name}',
      outputPathTemplate: 'partials/${area}/${name}.html'
    });
    computePathsProcessor.pathTemplates.push({
      docTypes: ['componentGroup' ],
      pathTemplate: '${area}/${moduleName}/${groupType}',
      outputPathTemplate: 'partials/${area}/${moduleName}/${groupType}.html'
    });

    computeIdsProcessor.idTemplates.push({
      docTypes: ['overview', 'tutorial', 'e2e-test', 'indexPage'],
      getId: function(doc) { 
        return doc.fileInfo.baseName; },
      getAliases: function(doc) { 
        return [doc.id]; 
      }
    });

    computeIdsProcessor.idTemplates.push({
      docTypes: ['error', 'errorNamespace'],
      getId: function(doc) {  
        return 'error:' + doc.name; },
      getAliases: function(doc) { return [doc.id]; }
    });
  })

  .config(function(checkAnchorLinksProcessor) {
    checkAnchorLinksProcessor.base = '/';
    // We are only interested in docs that have an area (i.e. they are pages)
    checkAnchorLinksProcessor.checkDoc = function(doc) { return doc.area; };
  })

  .config(function(
      generateIndexPagesProcessor,
      generateProtractorTestsProcessor,
      generateExamplesProcessor,
      defaultDeployment) {

    generateIndexPagesProcessor.deployments = [
      defaultDeployment
    ];

    generateProtractorTestsProcessor.deployments = [
      defaultDeployment
    ];

    generateProtractorTestsProcessor.basePath = path.resolve(process.cwd(),
      './' + opts.outputFolder);

    generateExamplesProcessor.deployments = [
      defaultDeployment
    ];
  });
};