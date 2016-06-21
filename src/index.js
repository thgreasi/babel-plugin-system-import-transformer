import { setBabelArgument } from './babelArgumentProvider';
import SystemImportExpressionTransformer from './SystemImportExpressionTransformer';

export default function (babel) {
  return {
    visitor: {
      CallExpression: function (path, state) {
        var callee = path.get('callee');
        if (callee && callee.matchesPattern('System.import')) {
          var params = path.get('arguments');
          if (params.length && params[0].isLiteral()) {
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
