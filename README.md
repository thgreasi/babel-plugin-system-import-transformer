# babel-plugin-system-import-transformer
Babel plugin that replaces System.import with the equivalent UMD pattern

## Transforms

```js
System.import('./utils/serializer').then(function(module){
    console.log(module);
});
```
to
```js
new Promise(function (resolve, reject) {
    var global = window;

    if (typeof global.define === 'function' && global.define.amd) {
        global.require(['utilsSerializer'], resolve, reject);
    } else if (typeof module !== 'undefined' && (module.exports && typeof require !== 'undefined') ||
               typeof module !== 'undefined' && (module.component && (global.require && global.require.loader === 'component'))) {
        resolve(require('./utils/serializer'));
    } else {
        resolve(global['utilsSerializer']);
    }
}).then(function(module){
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

## Configuration

### Relative paths and Aliases

The [babel's getModuleId option](http://babeljs.io/docs/usage/options/#formatting-options) (if defined) is used for the AMD and Global Module import.

```js
babel: {
    options: {
        moduleIds: true,
        getModuleId: function(moduleName) {
            var files = {
                'src/utils/serializer': 'utilsSerializer'
            };

            return files[moduleName] || moduleName.replace('src/', '');
        },
        plugins: ['system-import-transformer']
    }
}
```

### AMD & CommonJS

When babel is configured to use `AMD` or `CommonJS` modules
```js
babel: { options: { modules: 'amd' } }
// OR
babel: { options: { modules: 'common' /* this is the default value for babel */ } }
```
`system-import-transformer` will omit the module type detection code and just insert the appropriate require statement wrapped with a `Promise`.
