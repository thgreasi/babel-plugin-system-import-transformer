module.exports = function (babel) {
    var t = babel.types;

    function getOrCreateHelper(file) {
        var name = 'system-import-transformer-helper';

        var declar = file.declarations[name];
        if (declar) {
          return declar;
        }

        var uid = file.declarations[name] = file.scope.generateUidIdentifier(name);

        file.usedHelpers[name] = true;

        // typeof global.define === 'function' && global.define.amd
        var amdTest = t.logicalExpression('&&',
          t.binaryExpression('===',
            t.unaryExpression('typeof', t.memberExpression(
              t.identifier("global"),
              t.identifier("define")
            )),
            t.literal('function')
          ),
          t.memberExpression(
            t.memberExpression(
              t.identifier("global"),
              t.identifier("define")
            ),
            t.identifier("amd")
          )
        );

        // global.require(['localforageSerializer'], resolve, reject);
        var amdRequire = t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.identifier("global"),
              t.identifier("require")
            ),
            [
              t.arrayExpression([t.identifier("moduleName")]),
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
                t.identifier("global"),
                t.identifier("require")
              ),
              t.binaryExpression('===',
                t.memberExpression(
                  t.memberExpression(
                    t.identifier("global"),
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
                [t.identifier("moduleName")]
              )
            ]
          )
        );

        // resolve(global.localforageSerializer);
        var globalRequire = t.expressionStatement(
          t.callExpression(
            t.identifier("resolve"), [
              t.memberExpression(
                t.identifier("global"),
                t.identifier("moduleName")
              )
            ]
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

        var ref = t.functionExpression(null,
          [t.identifier("moduleName")],
          t.blockStatement([
            t.returnStatement(
              t.newExpression(t.identifier("Promise"), [
                t.functionExpression(null,
                  [t.identifier("resolve"), t.identifier("reject")],
                  t.blockStatement([
                    t.variableDeclaration("var", [t.variableDeclarator(t.identifier("global"), t.identifier("window"))]),
                    umdTests
                  ])
                )
              ])
            )
          ])
        );

        if (t.isFunctionExpression(ref) && !ref.id) {
            ref.body._compact = true;
            ref._generated = true;
            ref.id = uid;
            ref.type = "FunctionDeclaration";
            file.attachAuxiliaryComment(ref);
            file.path.unshiftContainer("body", ref);
        } else {
            ref._compact = true;
            file.scope.push({
                id: uid,
                init: ref,
                unique: true
            });
        }

        return uid;
    }

    return new babel.Transformer("system-import-transformer", {
        CallExpression: function (node, parent, scope, file) {
            if (this.get("callee").matchesPattern("System.import")) {
                node.callee = getOrCreateHelper(file);
            }
        }
    });
};
