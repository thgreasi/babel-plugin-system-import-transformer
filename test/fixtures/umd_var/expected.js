'use strict';

var _systemImportTransformerGlobalIdentifier = typeof window !== 'undefined' ? window : self;

var myModulePromise = typeof _systemImportTransformerGlobalIdentifier.define === 'function' && _systemImportTransformerGlobalIdentifier.define.amd ?
    new Promise(function (resolve, reject) {
        _systemImportTransformerGlobalIdentifier.require(['myModule'], resolve, reject);
    }) :
    typeof module !== 'undefined' && module.exports && typeof require !== 'undefined' || typeof module !== 'undefined' && module.component && _systemImportTransformerGlobalIdentifier.require && _systemImportTransformerGlobalIdentifier.require.loader === 'component' ?
    Promise.resolve(require(('myModule'))) :
    Promise.resolve(_systemImportTransformerGlobalIdentifier['myModule']);
myModulePromise.then(function (myModule) {});
