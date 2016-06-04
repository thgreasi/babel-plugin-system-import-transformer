# babel-plugin-system-import-transformer
[![Build Status](https://travis-ci.org/thgreasi/babel-plugin-system-import-transformer.svg?branch=master)](https://travis-ci.org/thgreasi/babel-plugin-system-import-transformer)
[![npm](https://img.shields.io/npm/v/babel-plugin-system-import-transformer.svg)](https://www.npmjs.com/package/babel-plugin-system-import-transformer)
[![npm](https://img.shields.io/npm/dm/babel-plugin-system-import-transformer.svg)](https://www.npmjs.com/package/babel-plugin-system-import-transformer)

[Babel](https://babeljs.io/) plugin that replaces System.import with the equivalent UMD pattern

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

## Requirements

- Babel v6.x.x

**Note:** for babel v5 please use the [v1.x.x releases](https://github.com/thgreasi/babel-plugin-system-import-transformer/tree/v1.x.x-stable).

## Installation

`npm install babel-plugin-system-import-transformer`

Add "system-import-transformer" to your `plugins` argument or inside the `plugins` options of your `Gruntfile`.

```js
// in .babelrc
{
    "plugins": [
        "system-import-transformer"
    ]
}

// in grunt.js
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

When you are transforming to `AMD` or `CommonJS` modules you should set the respective plugin option:
```js
// AMD
{
    "plugins": [
        ["system-import-transformer", { "modules": "amd" }]
    ]
}

// CommonJS
{
    "plugins": [
        ["system-import-transformer", { "modules": "common" }]
    ]
}
```
`system-import-transformer` will omit the module type detection code and just insert the appropriate require statement wrapped with a `Promise`.
```js
// AMD
new Promise(function (resolve, reject) {
    var global = window;
    global.require(['utilsSerializer'], resolve, reject);
}).then(function(module){ console.log(module); });

// CommonJS
new Promise(function (resolve, reject) {
    resolve(require('./utils/serializer'));
}).then(function(module){ console.log(module); });
```

**Note**: the default transpilation target is UMD
