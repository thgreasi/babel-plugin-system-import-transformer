'use strict';

var _systemImportTransformerGlobalIdentifier = typeof window !== 'undefined' ? window :
    typeof self !== 'undefined' ? self :
    typeof global !== 'undefined' ? global :
    {};

typeof _systemImportTransformerGlobalIdentifier.define === 'function' && _systemImportTransformerGlobalIdentifier.define.amd ?
    new Promise(function (resolve, reject) {
        _systemImportTransformerGlobalIdentifier.require(['npmModuleGlobalVar'], resolve, reject);
    }) :
    typeof module !== 'undefined' && module.exports && typeof require !== 'undefined' || typeof module !== 'undefined' && module.component && _systemImportTransformerGlobalIdentifier.require && _systemImportTransformerGlobalIdentifier.require.loader === 'component' ?
    Promise.resolve(require(('npmModule'))) :
    Promise.resolve(_systemImportTransformerGlobalIdentifier['npmModuleGlobalVar']);

// System.import('./myModule');
