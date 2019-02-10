import { types as t } from './babelArgumentProvider';

export function createResolveExpressionStatement(parameter) {
  const result = t.expressionStatement(
    t.callExpression(t.identifier('resolve'), [parameter]),
  );
  return result;
}

export function createPromiseResolveExpression(parameter) {
  const result = t.callExpression(
    t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
    [parameter],
  );
  return result;
}
