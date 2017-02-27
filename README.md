# babel-plugin-system-import-transformer
[![Build Status](https://travis-ci.org/thgreasi/babel-plugin-system-import-transformer.svg?branch=master)](https://travis-ci.org/thgreasi/babel-plugin-system-import-transformer)
[![npm](https://img.shields.io/npm/v/babel-plugin-system-import-transformer.svg)](https://www.npmjs.com/package/babel-plugin-system-import-transformer)
[![npm](https://img.shields.io/npm/dm/babel-plugin-system-import-transformer.svg)](https://www.npmjs.com/package/babel-plugin-system-import-transformer)

[Babel](https://babeljs.io/) plugin that replaces import() & System.import() with the equivalent UMD pattern

## Transforms

```js
import('./utils/serializer').then(function(module){
    console.log(module);
});

// AND

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

- Babel v6.14.x

**Notes:**
- for babel < v6.14 please use the [v2.x.x releases](https://github.com/thgreasi/babel-plugin-system-import-transformer/tree/v2.x.x-stable).
- for babel v5 please use the [v1.x.x releases](https://github.com/thgreasi/babel-plugin-system-import-transformer/tree/v1.x.x-stable).

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

## Options

### commonJS

CommonJS specific options.

#### commonJS.useRequireEnsure
Type: Boolean  
Values: [**`false`**/`true`]  

When set to `true`, all CommonJS import statements will use Webpack's `require.ensure()` syntax. This enables dynamic module loading in CommonJS (Webpack) and works both for the `UMD` and (of course) `CommonJS` module target types.

```js
{
    "plugins": [
        ["system-import-transformer", { "commonJS": { "useRequireEnsure": true } }]
    ]
}

// the CommonJS code part will look like:
new Promise(function (resolve) {
    require.ensure([], function (require) {
        resolve(require('./utils/serializer'));
    });
}).then(function(module){ console.log(module); });
```

### modules
Type: String  
Values: [**`UMD`**/`amd`/`common`]  
[Example](test/fixtures/common/.babelrc_extra)

Specifies the target compilation module system. When set configured to an option other than `UMD` then `system-import-transformer` will omit the module type detection code and just insert the appropriate require statement wrapped with a `Promise`.

```js
// targeting AMD
{
    "plugins": [
        ["system-import-transformer", { "modules": "amd" }]
    ]
}

// will emit an AMD specific code like:
new Promise(function (resolve, reject) {
    var global = window;
    global.require(['utilsSerializer'], resolve, reject);
}).then(function(module){ console.log(module); });
```

```js
// targeting CommonJS
{
    "plugins": [
        ["system-import-transformer", { "modules": "common" }]
    ]
}

// will emit a CommonJS specific code like:
new Promise(function (resolve, reject) {
    resolve(require('./utils/serializer'));
}).then(function(module){ console.log(module); });
```

### syntax

Syntax specific options.

#### syntax.import
Type: Boolean  
Values: [**`true`**/`false`]  
[Example](test/fixtures/umd-no-import/.babelrc_extra)

When set to `false`, babel will not transpile `import()` statements.

#### syntax["system-import"]
Type: Boolean  
Values: [**`true`**/`false`]  
[Example](test/fixtures/umd-no-system-import/.babelrc_extra)

When set to `false`, babel will not transpile `System.import()` statements.
