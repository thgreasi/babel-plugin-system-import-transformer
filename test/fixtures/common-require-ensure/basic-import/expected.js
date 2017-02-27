'use strict';

var testModule = new Promise(function (resolve) {
  require.ensure([], function (require) {
    resolve(require('test-module'));
  });
});
