module.exports = function (babel) {
  var t = babel.types;

  var path = require('path');

  var UmdFormatter = require('./../babel-core/lib/babel/transformation/modules/umd');

  function getImportPath(file, relativeImportPath) {
    var filename = file.opts.filename;
    var filePath = filename.replace(/[^\/]+$/, '');
    var result = path.join(filePath, relativeImportPath);
    return result;
  }

  function getImportModuleName(file, importPath) {
    var importedModulePath = getImportPath(file, importPath);

    // There should be a better way
    var importedModuleFile = t.cloneDeep(file);
    importedModuleFile.opts = t.cloneDeep(file.opts);
    importedModuleFile.opts.filename = importedModuleFile.opts.filenameRelative = importedModulePath + '.js';
    var result = new UmdFormatter(importedModuleFile).getModuleName();
    return result;
  }

  function getAmdTest(globalIdentifier) {
    // typeof global.define === 'function' && global.define.amd
    var amdTest = t.logicalExpression('&&',
      t.binaryExpression('===',
        t.unaryExpression('typeof', t.memberExpression(
          globalIdentifier,
          t.identifier('define')
        )),
        t.literal('function')
      ),
      t.memberExpression(
        t.memberExpression(
          globalIdentifier,
          t.identifier('define')
        ),
        t.identifier('amd')
      )
    );
    return amdTest;
  }

  function getAmdRequire(globalIdentifier, module) {
    // global.require(['localforageSerializer'], resolve, reject);
    var amdRequire = t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          globalIdentifier,
          t.identifier('require')
        ),
        [
          t.arrayExpression([module]),
          t.identifier('resolve'),
          t.identifier('reject')
        ]
      )
    );
    return amdRequire;
  }

  function getCommonJSTest() {
    // typeof module !== 'undefined' && module.exports && typeof require !== 'undefined'
    var commonJSTest = t.logicalExpression('&&',
      t.binaryExpression('!==',
        t.unaryExpression('typeof', t.identifier('module')),
        t.literal('undefined')
      ),
      t.logicalExpression('&&',
        t.memberExpression(
          t.identifier('module'),
          t.identifier('exports')
        ),
        t.binaryExpression('!==',
          t.unaryExpression('typeof', t.identifier('require')),
          t.literal('undefined')
        )
      )
    );
    return commonJSTest;
  }

  function getComponentTest(globalIdentifier) {
    // typeof module !== 'undefined' && module.component && global.require && global.require.loader === 'component'
    var componentTest = t.logicalExpression('&&',
      t.binaryExpression('!==',
        t.unaryExpression('typeof', t.identifier('module')),
        t.literal('undefined')
      ),
      t.logicalExpression('&&',
        t.memberExpression(
          t.identifier('module'),
          t.identifier('component')
        ),
        t.logicalExpression('&&',
          t.memberExpression(
            globalIdentifier,
            t.identifier('require')
          ),
          t.binaryExpression('===',
            t.memberExpression(
              t.memberExpression(
                globalIdentifier,
                t.identifier('require')
              ),
              t.identifier('loader')
            ),
            t.literal('component')
          )
        )
      )
    );
    return componentTest;
  }

  function getCommonJSRequire(module) {
    // resolve(require('./../utils/serializer'));
    var commonJSRequire = t.expressionStatement(
      t.callExpression(
        t.identifier('resolve'), [
          t.callExpression(
            t.identifier('require'),
            [module]
          )
        ]
      )
    );
    return commonJSRequire;
  }

  function getGlobalRequire(globalIdentifier, module) {
    // resolve(global.localforageSerializer);
    var globalMemberExpression = t.memberExpression(
      globalIdentifier,
      module
    );
    globalMemberExpression.computed = true;
    var globalRequire = t.expressionStatement(
      t.callExpression(
        t.identifier('resolve'), [globalMemberExpression]
      )
    );
    return globalRequire;
  }

  function createTransformedExpression(importedModuleNode, moduleNameNode, file) {
    var globalIdentifier = t.identifier('global');
    var globalVarDeclaration = t.variableDeclaration('var', [t.variableDeclarator(globalIdentifier, t.identifier('window'))]);
    if (!moduleNameNode) {
      moduleNameNode = importedModuleNode;
    }

    var amdTest = getAmdTest(globalIdentifier);

    var amdRequire = getAmdRequire(globalIdentifier, moduleNameNode);

    var commonJSTest = getCommonJSTest();

    var componentTest = getComponentTest(globalIdentifier);

    var commonJSRequire = getCommonJSRequire(importedModuleNode);

    var globalRequire = getGlobalRequire(globalIdentifier, moduleNameNode);

    var commonJSOrComponentTest = t.logicalExpression('||', commonJSTest, componentTest);

    var moduleImportExpressions;
    if (file.opts.modules === 'amd') {
      moduleImportExpressions = [globalVarDeclaration, amdRequire];
    } else if (file.opts.modules === 'common') {
      moduleImportExpressions = [commonJSRequire];
    } else {
      var umdRequire = t.ifStatement(amdTest,
        t.blockStatement([amdRequire]),
        t.ifStatement(commonJSOrComponentTest,
          t.blockStatement([commonJSRequire]),
          t.blockStatement([globalRequire])
        )
      );
      moduleImportExpressions = [globalVarDeclaration, umdRequire];
    }

    var newPromiseExpression = t.newExpression(t.identifier('Promise'), [
      t.functionExpression(null,
        [t.identifier('resolve'), t.identifier('reject')],
        t.blockStatement(moduleImportExpressions)
      )
    ]);
    return newPromiseExpression;
  }

  return new babel.Transformer('system-import-transformer', {
    CallExpression: function (node, parent, scope, file) {
      if (this.get('callee').matchesPattern('System.import')) {
        var params = this.get('arguments');
        if (params.length && params[0].isLiteral()) {
          var param = params[0];
          var importedModuleLiteral = t.literal(param.node.value);

          var moduleName = getImportModuleName(file, importedModuleLiteral.value);
          var moduleNameLiteral = t.literal(moduleName);

          var transformedExpression = createTransformedExpression(importedModuleLiteral, moduleNameLiteral, file);
          if (transformedExpression) {
            return t.expressionStatement(transformedExpression);
          }
        }
      }
    }
  });
};
