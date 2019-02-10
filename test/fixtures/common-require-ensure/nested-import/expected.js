'use strict';

function getModule(path) {
  return new Promise(function(resolve) {
    require.ensure([], function(require) {
      resolve(require('test-module'));
    });
  });
}

getModule().then(function() {});
