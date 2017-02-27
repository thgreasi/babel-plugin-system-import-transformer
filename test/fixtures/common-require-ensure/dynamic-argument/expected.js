'use strict';

var MODULE = 'test-module';

new Promise(function (resolve) {
  require.ensure([], function (require) {
    resolve(require(MODULE));
  });
});
new Promise(function (resolve) {
  require.ensure([], function (require) {
    resolve(require('test-' + MODULE));
  });
});
