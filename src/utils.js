import { types as t } from './babelArgumentProvider';

export function getGlobalObjectExpression(t) {
  return t.conditionalExpression(
    t.binaryExpression('!==',
      t.unaryExpression('typeof', t.identifier('window')),
      t.stringLiteral('undefined')
    ),
    t.identifier('window'),
    t.identifier('self')
  );
}

export function createResolveExpressionStatement (t, parameter) {
  var result = t.expressionStatement(
    t.callExpression(
      t.identifier('resolve'), [parameter]
    )
  );
  return result;
}

export function createPromiseResolveExpression (t, parameter) {
  var result =  t.callExpression(
    t.memberExpression(
      t.identifier('Promise'),
      t.identifier('resolve')
    ),
    [parameter]
  );
  return result;
}

export class UtilsHelper {
  constructor (file) {
    this.file = file;
  }

  getGlobalIdentifier () {
    var name = 'system-import-transformer-global-identifier';
    var result = this.getOrCreateHelper(name, function() {
      return getGlobalObjectExpression(t);
    });
    return result;
  }

  getOrCreateHelper (name, ref) {
    var declar = this.file.declarations[name];
    if (declar) {
      return declar;
    }

    var uid = this.file.declarations[name] = this.file.scope.generateUidIdentifier(name);
    this.file.usedHelpers[name] = true;

    if (typeof ref === 'function') {
      ref = ref();
    }

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
  }
}
