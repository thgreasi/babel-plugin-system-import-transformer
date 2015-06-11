# babel-plugin-system-import-transformer
Babel plugin that replaces System.import with the equivalent UMD pattern

## Transforms

```js
System.import('myImportedModule').then(function(module){
    console.log(module);
});
```
to
```js
// this is placed near the top of the file, next to the rest babel helpers
function _systemImportHelper(moduleName) {
    return new Promise(function(resolve, reject) {
        var global = window;
        if (typeof global.define === 'function' && global.define.amd) {
            global.require([moduleName], resolve, reject);
        } else if (typeof module !== 'undefined' && (module.exports && typeof require !== 'undefined') ||
            typeof module !== 'undefined' && (module.component && (global.require && global.require.loader === 'component'))) {
            resolve(require(moduleName));
        } else {
            resolve(global.moduleName);
        }
    });
}
/*...*/
_systemImportHelper('myImportedModule').then(function(module){
    console.log(module);
});
```

## Installation

`npm install babel-plugin-system-import-transformer`

Add "system-import-transformer" to your `plugins` argument or inside the `plugins` options of your `Gruntfile`.

```js
babel: {
    options: {
        plugins: ["system-import-transformer"]
    }
}
```
