'use strict';

var _systemImportTransformerGlobalIdentifier =
  typeof window !== 'undefined'
    ? window
    : typeof self !== 'undefined'
    ? self
    : typeof global !== 'undefined'
    ? global
    : {};

var x = 'test';

typeof _systemImportTransformerGlobalIdentifier.define === 'function' &&
_systemImportTransformerGlobalIdentifier.define.amd
  ? new Promise(function(resolve, reject) {
      _systemImportTransformerGlobalIdentifier.require(
        ['npmModule'.concat(x)],
        resolve,
        reject,
      );
    })
  : (typeof module !== 'undefined' &&
      module.exports &&
      typeof require !== 'undefined') ||
    (typeof module !== 'undefined' &&
      module.component &&
      _systemImportTransformerGlobalIdentifier.require &&
      _systemImportTransformerGlobalIdentifier.require.loader === 'component')
  ? Promise.resolve(require('npmModule'.concat(x)))
  : Promise.resolve(
      _systemImportTransformerGlobalIdentifier['npmModule'.concat(x)],
    );

typeof _systemImportTransformerGlobalIdentifier.define === 'function' &&
_systemImportTransformerGlobalIdentifier.define.amd
  ? new Promise(function(resolve, reject) {
      _systemImportTransformerGlobalIdentifier.require(
        ['./myModule/'.concat(x, '/file')],
        resolve,
        reject,
      );
    })
  : (typeof module !== 'undefined' &&
      module.exports &&
      typeof require !== 'undefined') ||
    (typeof module !== 'undefined' &&
      module.component &&
      _systemImportTransformerGlobalIdentifier.require &&
      _systemImportTransformerGlobalIdentifier.require.loader === 'component')
  ? Promise.resolve(require('./myModule/'.concat(x, '/file')))
  : Promise.resolve(
      _systemImportTransformerGlobalIdentifier[
        './myModule/'.concat(x, '/file')
      ],
    );
