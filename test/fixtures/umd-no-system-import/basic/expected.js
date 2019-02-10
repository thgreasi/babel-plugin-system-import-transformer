'use strict';

var _systemImportTransformerGlobalIdentifier =
  typeof window !== 'undefined'
    ? window
    : typeof self !== 'undefined'
    ? self
    : typeof global !== 'undefined'
    ? global
    : {};

System.import('npmModule');

System.import('npmModule/subModule');

System.import('./myModule');

System.import('../myOuterModule');

System.import('/myRootLevelModule');

typeof _systemImportTransformerGlobalIdentifier.define === 'function' &&
_systemImportTransformerGlobalIdentifier.define.amd
  ? new Promise(function(resolve, reject) {
      _systemImportTransformerGlobalIdentifier.require(
        ['npmModule'],
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
  ? Promise.resolve(require('npmModule'))
  : Promise.resolve(_systemImportTransformerGlobalIdentifier['npmModule']);

typeof _systemImportTransformerGlobalIdentifier.define === 'function' &&
_systemImportTransformerGlobalIdentifier.define.amd
  ? new Promise(function(resolve, reject) {
      _systemImportTransformerGlobalIdentifier.require(
        ['npmModule/subModule'],
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
  ? Promise.resolve(require('npmModule/subModule'))
  : Promise.resolve(
      _systemImportTransformerGlobalIdentifier['npmModule/subModule'],
    );

typeof _systemImportTransformerGlobalIdentifier.define === 'function' &&
_systemImportTransformerGlobalIdentifier.define.amd
  ? new Promise(function(resolve, reject) {
      _systemImportTransformerGlobalIdentifier.require(
        ['./myModule'],
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
  ? Promise.resolve(require('./myModule'))
  : Promise.resolve(_systemImportTransformerGlobalIdentifier['./myModule']);

typeof _systemImportTransformerGlobalIdentifier.define === 'function' &&
_systemImportTransformerGlobalIdentifier.define.amd
  ? new Promise(function(resolve, reject) {
      _systemImportTransformerGlobalIdentifier.require(
        ['../myOuterModule'],
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
  ? Promise.resolve(require('../myOuterModule'))
  : Promise.resolve(
      _systemImportTransformerGlobalIdentifier['../myOuterModule'],
    );

typeof _systemImportTransformerGlobalIdentifier.define === 'function' &&
_systemImportTransformerGlobalIdentifier.define.amd
  ? new Promise(function(resolve, reject) {
      _systemImportTransformerGlobalIdentifier.require(
        ['/myRootLevelModule'],
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
  ? Promise.resolve(require('/myRootLevelModule'))
  : Promise.resolve(
      _systemImportTransformerGlobalIdentifier['/myRootLevelModule'],
    );
