import { types as t } from './babelArgumentProvider';

export function createResolveExpressionStatement (parameter) {
  var result = t.expressionStatement(
    t.callExpression(
      t.identifier('resolve'), [parameter]
    )
  );
  return result;
}

export function createPromiseResolveExpression (parameter) {
  var result =  t.callExpression(
    t.memberExpression(
      t.identifier('Promise'),
      t.identifier('resolve')
    ),
    [parameter]
  );
  return result;
}
