'use strict';

new Promise(function (resolve) {
  require.ensure([], function (require) {
    resolve(require('test-module'));
  });
}).then(function () {
  return new Promise(function (resolve) {
    require.ensure([], function (require) {
      resolve(require('test-module-2'));
    });
  });
});

Promise.all([new Promise(function (resolve) {
  require.ensure([], function (require) {
    resolve(require('test-1'));
  });
}), new Promise(function (resolve) {
  require.ensure([], function (require) {
    resolve(require('test-2'));
  });
}), new Promise(function (resolve) {
  require.ensure([], function (require) {
    resolve(require('test-3'));
  });
})]).then(function () {});
