'use strict';

new Promise(function(resolve) {
  require.ensure([], function(require) {
    resolve(require('npmModule'));
  });
});
