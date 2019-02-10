import { types as t } from './babelArgumentProvider';
import { getImportModuleName } from './moduleImportHelper';
import { createPromiseResolveExpression } from './promiseUtils';
import { UtilsHelper } from './utils';

export default class SystemImportExpressionTransformer {
  constructor(state, params) {
    this.state = state;
    this.file = state.file;
    this.pluginOptions = this.state.opts;
    this.moduleType = this.pluginOptions.modules;
    const param = params[0];

    this.importedModuleExpression = param.node;
    this.moduleNameExpression = this.importedModuleExpression;

    if (this.importedModuleExpression.type === 'StringLiteral') {
      const moduleName = getImportModuleName(
        this.file,
        this.importedModuleExpression.value,
      );
      this.moduleNameExpression = t.stringLiteral(moduleName); // for AMD and Global when configured
    }
  }

  getGlobalIdentifier() {
    if (this.globalIdentifier) {
      return this.globalIdentifier;
    }
    this.globalIdentifier = new UtilsHelper(this.file).getGlobalIdentifier();
    return this.globalIdentifier;
  }

  getAmdTest() {
    const globalIdentifier = this.getGlobalIdentifier();
    // typeof global.define === 'function' && global.define.amd
    const amdTest = t.logicalExpression(
      '&&',
      t.binaryExpression(
        '===',
        t.unaryExpression(
          'typeof',
          t.memberExpression(globalIdentifier, t.identifier('define')),
        ),
        t.stringLiteral('function'),
      ),
      t.memberExpression(
        t.memberExpression(globalIdentifier, t.identifier('define')),
        t.identifier('amd'),
      ),
    );
    return amdTest;
  }

  getAmdRequirePromise(module) {
    const globalIdentifier = this.getGlobalIdentifier();
    // global.require(['localforageSerializer'], resolve, reject);
    const amdRequire = t.expressionStatement(
      t.callExpression(
        t.memberExpression(globalIdentifier, t.identifier('require')),
        [
          t.arrayExpression([module]),
          t.identifier('resolve'),
          t.identifier('reject'),
        ],
      ),
    );

    const newPromiseExpression = t.newExpression(t.identifier('Promise'), [
      t.functionExpression(
        null,
        [t.identifier('resolve'), t.identifier('reject')],
        t.blockStatement([amdRequire]),
      ),
    ]);
    return newPromiseExpression;
  }

  getCommonJSTest() {
    // typeof module !== 'undefined' && module.exports && typeof require !== 'undefined'
    const commonJSTest = t.logicalExpression(
      '&&',
      t.binaryExpression(
        '!==',
        t.unaryExpression('typeof', t.identifier('module')),
        t.stringLiteral('undefined'),
      ),
      t.logicalExpression(
        '&&',
        t.memberExpression(t.identifier('module'), t.identifier('exports')),
        t.binaryExpression(
          '!==',
          t.unaryExpression('typeof', t.identifier('require')),
          t.stringLiteral('undefined'),
        ),
      ),
    );
    return commonJSTest;
  }

  getComponentTest() {
    const globalIdentifier = this.getGlobalIdentifier();
    // typeof module !== 'undefined' && module.component && global.require && global.require.loader === 'component'
    const componentTest = t.logicalExpression(
      '&&',
      t.binaryExpression(
        '!==',
        t.unaryExpression('typeof', t.identifier('module')),
        t.stringLiteral('undefined'),
      ),
      t.logicalExpression(
        '&&',
        t.memberExpression(t.identifier('module'), t.identifier('component')),
        t.logicalExpression(
          '&&',
          t.memberExpression(globalIdentifier, t.identifier('require')),
          t.binaryExpression(
            '===',
            t.memberExpression(
              t.memberExpression(globalIdentifier, t.identifier('require')),
              t.identifier('loader'),
            ),
            t.stringLiteral('component'),
          ),
        ),
      ),
    );
    return componentTest;
  }

  getCommonJSRequire(module) {
    // resolve(require('./../utils/serializer'));

    const commonJSRequireExpression = t.callExpression(
      t.identifier('require'),
      // [module] // why this isn't working???
      // [module, t.identifier('undefined')] // had to add extra undefined parameter or parenthesis !?!?!?
      [t.parenthesizedExpression(module)],
    );
    return commonJSRequireExpression;
  }

  getCommonJSRequirePromise(module) {
    if (
      this.pluginOptions.commonJS &&
      this.pluginOptions.commonJS.useRequireEnsure
    ) {
      return this.getCommonJSRequireEnsurePromise(module);
    }
    return this.getCommonJSPlainRequirePromise(module);
  }

  getCommonJSPlainRequirePromise(module) {
    const commonJSRequireExpression = this.getCommonJSRequire(module);
    const commonJSRequire = createPromiseResolveExpression(
      commonJSRequireExpression,
    );
    return commonJSRequire;
  }

  getCommonJSRequireEnsurePromise(module) {
    // require.ensure([], function(require) { resolve(require(module)); });
    const requireEnsure = t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier('require'), t.identifier('ensure')),
        [
          t.arrayExpression([]),
          t.functionExpression(
            null,
            [t.identifier('require')],
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(t.identifier('resolve'), [
                  t.callExpression(t.identifier('require'), [module]),
                ]),
              ),
            ]),
          ),
        ],
      ),
    );

    const newPromiseExpression = t.newExpression(t.identifier('Promise'), [
      t.functionExpression(
        null,
        [t.identifier('resolve')],
        t.blockStatement([requireEnsure]),
      ),
    ]);
    return newPromiseExpression;
  }

  getGlobalRequire(module) {
    const globalIdentifier = this.getGlobalIdentifier();

    // resolve(global.localforageSerializer);
    const globalMemberExpression = t.memberExpression(
      globalIdentifier,
      module,
      true, // computed
    );
    return globalMemberExpression;
  }

  getGlobalRequirePromise(module) {
    const globalMemberExpression = this.getGlobalRequire(module);
    const globalRequire = createPromiseResolveExpression(
      globalMemberExpression,
    );
    return globalRequire;
  }

  createTransformedExpression() {
    let moduleImportExpression;
    if (this.moduleType === 'amd') {
      moduleImportExpression = this.getAmdRequirePromise(
        this.moduleNameExpression,
      );
    } else if (this.moduleType === 'common') {
      moduleImportExpression = this.getCommonJSRequirePromise(
        this.importedModuleExpression,
      );
    } else if (this.moduleType === 'global') {
      moduleImportExpression = this.getGlobalRequirePromise(
        this.moduleNameExpression,
      );
    } else {
      // umd
      const amdTest = this.getAmdTest();
      const commonJSTest = this.getCommonJSTest();
      const componentTest = this.getComponentTest();
      const commonJSOrComponentTest = t.logicalExpression(
        '||',
        commonJSTest,
        componentTest,
      );

      const umdRequire = t.conditionalExpression(
        amdTest,
        this.getAmdRequirePromise(this.moduleNameExpression),
        t.conditionalExpression(
          commonJSOrComponentTest,
          this.getCommonJSRequirePromise(this.importedModuleExpression),
          this.getGlobalRequirePromise(this.moduleNameExpression),
        ),
      );
      moduleImportExpression = umdRequire;
    }

    return moduleImportExpression;
  }
}
