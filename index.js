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

    var name = 'system-import-transformer-global-identifier';
    var ref = t.conditionalExpression(
      t.binaryExpression('!==',
        t.unaryExpression('typeof', t.identifier('window')),
        t.literal('undefined')
      ),
      t.identifier('window'),
      t.identifier('self')
    );
    this.globalIdentifier = this.getOrCreateHelper(name, ref);
    return this.globalIdentifier;
  };

  SystemImportExpressionTransformer.prototype.getOrCreateHelper = function (name, ref) {
    var declar = this.file.declarations[name];
    if (declar) {
      return declar;
    }

    var uid = this.file.declarations[name] = this.file.scope.generateUidIdentifier(name);
    this.file.usedHelpers[name] = true;

    if (t.isFunctionExpression(ref) && !ref.id) {
        ref.body._compact = true;
        ref._generated = true;
        ref.id = uid;
        ref.type = "FunctionDeclaration";
        this.file.attachAuxiliaryComment(ref);
        this.file.path.unshiftContainer("body", ref);
    } else {
        ref._compact = true;
        this.file.scope.push({
            id: uid,
            init: ref,
            unique: true
        });
    }

    return uid;
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
    var moduleImportExpressions;
    if (this.file.opts.modules === 'amd') {
      moduleImportExpressions = [this.getAmdRequire(this.moduleNameLiteral)];
    } else if (this.file.opts.modules === 'common') {
      moduleImportExpressions = [this.getCommonJSRequire(this.importedModuleLiteral)];
    } else {
      var amdTest = this.getAmdTest();
      var commonJSTest = this.getCommonJSTest();
      var componentTest = this.getComponentTest();
      var commonJSOrComponentTest = t.logicalExpression('||', commonJSTest, componentTest);

      var umdRequire = t.ifStatement(amdTest,
        t.blockStatement([this.getAmdRequire(this.moduleNameLiteral)]),
        t.ifStatement(commonJSOrComponentTest,
          t.blockStatement([this.getCommonJSRequire(this.importedModuleLiteral)]),
          t.blockStatement([this.getGlobalRequire(this.moduleNameLiteral)])
        )
      );
      moduleImportExpressions = [umdRequire];
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
