import { types as t } from './babelArgumentProvider';

export function getGlobalObjectExpression() {
  return t.conditionalExpression(
    t.binaryExpression('!==',
      t.unaryExpression('typeof', t.identifier('window')),
      t.stringLiteral('undefined')
    ),
    t.identifier('window'),
    t.identifier('self')
  );
}
