import { types as t } from './babelArgumentProvider';
import { getGlobalObjectExpression } from './globalObjectHelper';

export class UtilsHelper {
  constructor (file) {
    this.file = file;
  }

  getGlobalIdentifier () {
    const name = 'system-import-transformer-global-identifier';
    const result = this.getOrCreateHelper(name, function() {
      return getGlobalObjectExpression();
    });
    return result;
  }

  getOrCreateHelper (name, ref) {
    const declar = this.file.declarations[name];
    if (declar) {
      return declar;
    }

    const uid = this.file.declarations[name] = this.file.scope.generateUidIdentifier(name);
    this.file.hub.addHelper(name)

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
