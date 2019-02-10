import { declare } from '@babel/helper-plugin-utils';
import importSyntax from '@babel/plugin-syntax-dynamic-import';
import { setBabelArgument } from './babelArgumentProvider';
import SystemImportExpressionTransformer from './SystemImportExpressionTransformer';

const PATTERN_SYSTEM_IMPORT = 'System.import';
const TYPE_IMPORT = 'Import';

export default declare(api => {
  api.assertVersion(7);
  return {
    inherits: importSyntax,

    visitor: {
      CallExpression: function(path, state) {
        const callee = path.get('callee');
        if (!callee) {
          return;
        }

        const pluginOptions = state.opts || {};
        const syntax = pluginOptions.syntax || {};

        if (
          (syntax['system-import'] !== false &&
            callee.matchesPattern(PATTERN_SYSTEM_IMPORT)) ||
          (syntax.import !== false && callee.type === TYPE_IMPORT)
        ) {
          const params = path.get('arguments');
          if (params.length) {
            setBabelArgument(api);
            const transformer = new SystemImportExpressionTransformer(
              state,
              params,
            );
            const transformedExpression = transformer.createTransformedExpression();
            if (transformedExpression) {
              path.replaceWith(transformedExpression);
            }
          }
        }
      },
    },
  };
});
