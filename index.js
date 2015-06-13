module.exports = function (babel) {
  var t = babel.types;

  function createTransformedExpression(importedModuleNode) {
    var globalIdentifier = t.identifier("global");

    // typeof global.define === 'function' && global.define.amd
    var amdTest = t.logicalExpression('&&',
      t.binaryExpression('===',
        t.unaryExpression('typeof', t.memberExpression(
          globalIdentifier,
          t.identifier("define")
        )),
        t.literal('function')
      ),
      t.memberExpression(
        t.memberExpression(
          globalIdentifier,
          t.identifier("define")
        ),
        t.identifier("amd")
      )
    );

    // global.require(['localforageSerializer'], resolve, reject);
    var amdRequire = t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          globalIdentifier,
          t.identifier("require")
        ),
        [
          t.arrayExpression([importedModuleNode]),
          t.identifier("resolve"),
          t.identifier("reject")
        ]
      )
    );

    // typeof module !== 'undefined' && module.exports && typeof require !== 'undefined'
    var commonJSTest = t.logicalExpression('&&',
      t.binaryExpression('!==',
        t.unaryExpression('typeof', t.identifier("module")),
        t.literal('undefined')
      ),
      t.logicalExpression('&&',
        t.memberExpression(
          t.identifier("module"),
          t.identifier("exports")
        ),
        t.binaryExpression('!==',
          t.unaryExpression('typeof', t.identifier("require")),
          t.literal('undefined')
        )
      )
    );

    // typeof module !== 'undefined' && module.component && global.require && global.require.loader === 'component'
    var componentTest = t.logicalExpression('&&',
      t.binaryExpression('!==',
        t.unaryExpression('typeof', t.identifier("module")),
        t.literal('undefined')
      ),
      t.logicalExpression('&&',
        t.memberExpression(
          t.identifier("module"),
          t.identifier("component")
        ),
        t.logicalExpression('&&',
          t.memberExpression(
            globalIdentifier,
            t.identifier("require")
          ),
          t.binaryExpression('===',
            t.memberExpression(
              t.memberExpression(
                globalIdentifier,
                t.identifier("require")
              ),
              t.identifier("loader")
            ),
            t.literal('component')
          )
        )
      )
    );

    // resolve(require('./../utils/serializer'));
    var commonJSRequire = t.expressionStatement(
      t.callExpression(
        t.identifier("resolve"), [
          t.callExpression(
            t.identifier("require"),
            [importedModuleNode]
          )
        ]
      )
    );

    // resolve(global.localforageSerializer);
    var globalMemberExpression = t.memberExpression(
      globalIdentifier,
      importedModuleNode
    );
    globalMemberExpression.computed = true;
    var globalRequire = t.expressionStatement(
      t.callExpression(
        t.identifier("resolve"), [globalMemberExpression]
      )
    );

    var commonJSOrComponentTest = t.logicalExpression('||', commonJSTest, componentTest);

    var umdTests = t.ifStatement(amdTest,
      t.blockStatement([amdRequire]),
      t.ifStatement(commonJSOrComponentTest,
        t.blockStatement([commonJSRequire]),
        t.blockStatement([globalRequire])
      )
    );

    var newPromiseExpression = t.newExpression(t.identifier("Promise"), [
      t.functionExpression(null,
        [t.identifier("resolve"), t.identifier("reject")],
        t.blockStatement([
          t.variableDeclaration("var", [t.variableDeclarator(globalIdentifier, t.identifier("window"))]),
          umdTests
        ])
      )
    ]);
    return newPromiseExpression;
  }

  return new babel.Transformer("system-import-transformer", {
    CallExpression: function (node, parent, scope, file) {
      if (this.get("callee").matchesPattern("System.import")) {
        var params = this.get("arguments");
        if (params.length && params[0].isLiteral()) {
          var param = params[0];
          var moduleNameLiteral = t.literal(param.node.value);
          return t.expressionStatement(createTransformedExpression(moduleNameLiteral));
        }
      }
    }
  });
};
