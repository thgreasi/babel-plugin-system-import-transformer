module.exports = function (babel) {
  var t = babel.types;

  var path = require('path');

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
    var UmdFormatter = file.moduleFormatter.constructor;
    var result = new UmdFormatter(importedModuleFile).getModuleName();
    return result;
  }

  function SystemImportExpressionTransformer(file, params) {
    this.file = file;
    var param = params[0];
    this.importedModuleLiteral = t.literal(param.node.value);

    var moduleName = getImportModuleName(this.file, this.importedModuleLiteral.value);
    this.moduleNameLiteral = t.literal(moduleName);
  }

  SystemImportExpressionTransformer.prototype.getGlobalIdentifier = function () {
    if (this.globalIdentifier) {
      return this.globalIdentifier;
    }
    this.globalIdentifier = t.identifier('global');
    return this.globalIdentifier;
  };

  SystemImportExpressionTransformer.prototype.getGlobalVarDeclaration = function () {
    if (this.globalVarDeclaration) {
      return this.globalVarDeclaration;
    }
    this.globalVarDeclaration = t.variableDeclaration('var', [t.variableDeclarator(this.getGlobalIdentifier(), t.identifier('window'))]);
    return this.globalVarDeclaration;
  };

  SystemImportExpressionTransformer.prototype.getAmdTest = function () {
    var globalIdentifier = this.getGlobalIdentifier();
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
  };

  SystemImportExpressionTransformer.prototype.getAmdRequire = function (module) {
    var globalIdentifier = this.getGlobalIdentifier();
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
  };

  SystemImportExpressionTransformer.prototype.getCommonJSTest = function () {
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
  };

  SystemImportExpressionTransformer.prototype.getComponentTest = function () {
    var globalIdentifier = this.getGlobalIdentifier();
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
  };

  SystemImportExpressionTransformer.prototype.getCommonJSRequire = function (module) {
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
  };

  SystemImportExpressionTransformer.prototype.getGlobalRequire = function (module) {
    var globalIdentifier = this.getGlobalIdentifier();
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
  };

  SystemImportExpressionTransformer.prototype.createTransformedExpression = function () {
    var globalVarDeclaration = this.getGlobalVarDeclaration();

    var amdTest = this.getAmdTest();

    var amdRequire = this.getAmdRequire(this.moduleNameLiteral);

    var commonJSTest = this.getCommonJSTest();

    var componentTest = this.getComponentTest();

    var commonJSRequire = this.getCommonJSRequire(this.importedModuleLiteral);

    var globalRequire = this.getGlobalRequire(this.moduleNameLiteral);

    var commonJSOrComponentTest = t.logicalExpression('||', commonJSTest, componentTest);

    var moduleImportExpressions;
    if (this.file.opts.modules === 'amd') {
      moduleImportExpressions = [globalVarDeclaration, amdRequire];
    } else if (this.file.opts.modules === 'common') {
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
  };

  return new babel.Transformer('system-import-transformer', {
    CallExpression: function (node, parent, scope, file) {
      if (this.get('callee').matchesPattern('System.import')) {
        var params = this.get('arguments');
        if (params.length && params[0].isLiteral()) {
          var transformer = new SystemImportExpressionTransformer(file, params);
          var transformedExpression = transformer.createTransformedExpression();
          if (transformedExpression) {
            return t.expressionStatement(transformedExpression);
          }
        }
      }
    }
  });
};
