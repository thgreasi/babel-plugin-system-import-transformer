define('actualGlobalVar', [], function() {
  'use strict';
  var _systemImportTransformerGlobalIdentifier =
    typeof window !== 'undefined'
      ? window
      : typeof self !== 'undefined'
      ? self
      : typeof global !== 'undefined'
      ? global
      : {};

  new Promise(function(resolve, reject) {
    _systemImportTransformerGlobalIdentifier.require(
      ['npmModuleGlobalVar'],
      resolve,
      reject,
    );
  });
});

// System.import('./myModule');
