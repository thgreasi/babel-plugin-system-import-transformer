import { types as t } from './babelArgumentProvider';
import { getImportModuleName } from './moduleImportHelper';
import { createPromiseResolveExpression } from './promiseUtils';
import { UtilsHelper } from './utils';

export default class SystemImportExpressionTransformer {
  constructor (state, params) {
    this.state = state;
    this.file = state.file;
    this.pluginOptions = this.state.opts;
    this.moduleType = this.pluginOptions.modules;
    var param = params[0];

    this.importedModuleExpression = param.node;
    this.moduleNameExpression = this.importedModuleExpression;

    if (this.importedModuleExpression.type === 'StringLiteral') {
      var moduleName = getImportModuleName(this.file, this.importedModuleExpression.value);
      this.moduleNameExpression = t.stringLiteral(moduleName); // for AMD and Global when configured
    }
  }

  getGlobalIdentifier () {
    if (this.globalIdentifier) {
      return this.globalIdentifier;
    }
    this.globalIdentifier = new UtilsHelper(this.file).getGlobalIdentifier();
    return this.globalIdentifier;
  }

  getAmdTest () {
    var globalIdentifier = this.getGlobalIdentifier();
    // typeof global.define === 'function' && global.define.amd
    var amdTest = t.logicalExpression('&&',
      t.binaryExpression('===',
        t.unaryExpression('typeof', t.memberExpression(
          globalIdentifier,
          t.identifier('define')
        )),
        t.stringLiteral('function')
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

  getAmdRequirePromise (module) {
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

    var newPromiseExpression = t.newExpression(t.identifier('Promise'), [
      t.functionExpression(null,
        [t.identifier('resolve'), t.identifier('reject')],
        t.blockStatement([amdRequire])
      )
    ]);
    return newPromiseExpression;
  }

  getCommonJSTest () {
    // typeof module !== 'undefined' && module.exports && typeof require !== 'undefined'
    var commonJSTest = t.logicalExpression('&&',
      t.binaryExpression('!==',
        t.unaryExpression('typeof', t.identifier('module')),
        t.stringLiteral('undefined')
      ),
      t.logicalExpression('&&',
        t.memberExpression(
          t.identifier('module'),
          t.identifier('exports')
        ),
        t.binaryExpression('!==',
          t.unaryExpression('typeof', t.identifier('require')),
          t.stringLiteral('undefined')
        )
      )
    );
    return commonJSTest;
  }

  getComponentTest () {
    var globalIdentifier = this.getGlobalIdentifier();
    // typeof module !== 'undefined' && module.component && global.require && global.require.loader === 'component'
    var componentTest = t.logicalExpression('&&',
      t.binaryExpression('!==',
        t.unaryExpression('typeof', t.identifier('module')),
        t.stringLiteral('undefined')
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
            t.stringLiteral('component')
          )
        )
      )
    );
    return componentTest;
  }

  getCommonJSRequire (module) {
    // resolve(require('./../utils/serializer'));
    
    var commonJSRequireExpression = t.callExpression(
      t.identifier('require'),
      // [module] // why this isn't working???
      // [module, t.identifier('undefined')] // had to add extra undefined parameter or parenthesis !?!?!?
      [t.parenthesizedExpression(module)]
    );
    return commonJSRequireExpression;
  }

  getCommonJSRequirePromise (module) {
    var commonJSRequireExpression = this.getCommonJSRequire(module);
    var commonJSRequire = createPromiseResolveExpression(commonJSRequireExpression);
    return commonJSRequire;
  }

  getGlobalRequire (module) {
    var globalIdentifier = this.getGlobalIdentifier();

    // resolve(global.localforageSerializer);
    var globalMemberExpression = t.memberExpression(
      globalIdentifier,
      module,
      true // computed
    );
    return globalMemberExpression;
  }

  getGlobalRequirePromise (module) {
    var globalMemberExpression = this.getGlobalRequire(module);
    var globalRequire = createPromiseResolveExpression(globalMemberExpression);
    return globalRequire;
  }

  createTransformedExpression () {
    var moduleImportExpression;
    if (this.moduleType === 'amd') {
      moduleImportExpression = this.getAmdRequirePromise(this.moduleNameExpression);
    } else if (this.moduleType === 'common') {
      moduleImportExpression = this.getCommonJSRequirePromise(this.importedModuleExpression);
    } else if (this.moduleType === 'global') {
      moduleImportExpression = this.getGlobalRequirePromise(this.moduleNameExpression);
    } else { // umd
      var amdTest = this.getAmdTest();
      var commonJSTest = this.getCommonJSTest();
      var componentTest = this.getComponentTest();
      var commonJSOrComponentTest = t.logicalExpression('||', commonJSTest, componentTest);

      var umdRequire = t.conditionalExpression(amdTest,
        this.getAmdRequirePromise(this.moduleNameExpression),
        t.conditionalExpression(commonJSOrComponentTest,
          this.getCommonJSRequirePromise(this.importedModuleExpression),
          this.getGlobalRequirePromise(this.moduleNameExpression)
        )
      );
      moduleImportExpression = umdRequire;
    }

    return moduleImportExpression;
  }
}
