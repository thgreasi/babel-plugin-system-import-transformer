import importSyntax from 'babel-plugin-syntax-dynamic-import';
import { setBabelArgument } from './babelArgumentProvider';
import SystemImportExpressionTransformer from './SystemImportExpressionTransformer';

const PATTERN_SYSTEM_IMPORT = 'System.import';
const TYPE_IMPORT = 'Import';

export default function (babel) {
  return {
    inherits: importSyntax,

    visitor: {
      CallExpression: function (path, state) {
        var callee = path.get('callee');
        if (!callee) {
          return;
        }

        let pluginOptions = state.opts || {};
        let syntax = pluginOptions.syntax || {};

        if ((syntax["system-import"] !== false && callee.matchesPattern(PATTERN_SYSTEM_IMPORT)) ||
            (syntax.import !== false && callee.type === TYPE_IMPORT)) {
          var params = path.get('arguments');
          if (params.length) {
            setBabelArgument(babel);
            var transformer = new SystemImportExpressionTransformer(state, params);
            var transformedExpression = transformer.createTransformedExpression();
            if (transformedExpression) {
              path.replaceWith(transformedExpression);
            }
          }
        }
      }
    }
  };
}
