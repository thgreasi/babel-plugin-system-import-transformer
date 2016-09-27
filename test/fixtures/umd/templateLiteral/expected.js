'use strict';

var _systemImportTransformerGlobalIdentifier = typeof window !== 'undefined' ? window :
    typeof self !== 'undefined' ? self :
    typeof global !== 'undefined' ? global :
    {};

var x = 'test';

typeof _systemImportTransformerGlobalIdentifier.define === 'function' && _systemImportTransformerGlobalIdentifier.define.amd ?
    new Promise(function (resolve, reject) {
        _systemImportTransformerGlobalIdentifier.require(['npmModule' + x], resolve, reject);
    }) :
    typeof module !== 'undefined' && module.exports && typeof require !== 'undefined' || typeof module !== 'undefined' && module.component && _systemImportTransformerGlobalIdentifier.require && _systemImportTransformerGlobalIdentifier.require.loader === 'component' ?
    Promise.resolve(require(('npmModule' + x))) :
    Promise.resolve(_systemImportTransformerGlobalIdentifier['npmModule' + x]);

typeof _systemImportTransformerGlobalIdentifier.define === 'function' && _systemImportTransformerGlobalIdentifier.define.amd ?
    new Promise(function (resolve, reject) {
        _systemImportTransformerGlobalIdentifier.require(['./myModule/' + x + '/file'], resolve, reject);
    }) :
    typeof module !== 'undefined' && module.exports && typeof require !== 'undefined' || typeof module !== 'undefined' && module.component && _systemImportTransformerGlobalIdentifier.require && _systemImportTransformerGlobalIdentifier.require.loader === 'component' ?
    Promise.resolve(require(('./myModule/' + x + '/file'))) :
    Promise.resolve(_systemImportTransformerGlobalIdentifier['./myModule/' + x + '/file']);
