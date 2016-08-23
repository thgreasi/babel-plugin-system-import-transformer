import { types as t } from './babelArgumentProvider';

export function getGlobalObjectExpression() {
  return t.conditionalExpression(
    t.binaryExpression('!==',
      t.unaryExpression('typeof', t.identifier('window')),
      t.stringLiteral('undefined')
    ),
    t.identifier('window'),
    t.conditionalExpression(
      t.binaryExpression('!==',
        t.unaryExpression('typeof', t.identifier('self')),
        t.stringLiteral('undefined')
      ),
      t.identifier('self'),
      t.conditionalExpression(
        t.binaryExpression('!==',
          t.unaryExpression('typeof', t.identifier('global')),
          t.stringLiteral('undefined')
        ),
        t.identifier('global'),
        t.objectExpression([])
      )
    )
  );
}
