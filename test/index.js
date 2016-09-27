var assert = require('assert');
var babel = require('babel-core');
var chalk = require('chalk');
var clear = require('clear');
var diff = require('diff');
var fs = require('fs');
var path = require('path');
var beautify = require('js-beautify').js_beautify;

require('babel-register');

var pluginPath = require.resolve('../.');

function traverseFolders(dir) {
  if (!fs.statSync(dir.path).isDirectory()) {
    return [];
  }

  var innerFolders = fs.readdirSync(dir.path).map(function(item) {
    return {
      path: path.join(dir.path, item),
      name: item,
      relativeName: dir.relativeName ?
                    dir.relativeName + '/' + item :
                    item
    };
  }).filter(function(item) {
    return fs.statSync(item.path).isDirectory();
  });

  if (!innerFolders.length) {
    return [dir];
  } else {
    return innerFolders.map(traverseFolders).reduce(function (aggr, crnt) {
      return aggr.concat(crnt);
    }, []);
  }
}

function runTests() {
  var testsPath = __dirname + '/fixtures/';

  var fixtureFolders = traverseFolders({
    path: testsPath,
    name: 'fixtures',
    relativeName: ''
  });

  var result = fixtureFolders.filter(function (dir) {
    return dir.name[0] !== '_';
  }).map(runTest).reduce(function (aggr, crnt) {
    return aggr + !crnt;
  }, 0);
  return result;
}

function createBabelModuleIdProvider(fileMap) {
  return function babelModuleIdProvider(moduleName) {
    // var fileMap = {
    //   'myModule': 'myModuleGlobalVar'
    // };

    var result = fileMap[moduleName] || moduleName.replace('src/', '');
    return result;
  };
}

function getBabelConfiguration(dir) {
  var defaultConfiguration = {
    plugins: [pluginPath]
  };
  var configurations = [defaultConfiguration];

  var crntPath = dir.path;
  for (var i = 0, len = 2; i < len; i++) {
    var extraConfiguration = {};
    var babelrcPath = crntPath + '/.babelrc_extra';
    if (fs.existsSync(babelrcPath)) {
      extraConfiguration = JSON.parse(fs.readFileSync(babelrcPath, 'utf8'));
      if (extraConfiguration.getModuleId) {
        extraConfiguration.getModuleId = createBabelModuleIdProvider(extraConfiguration.getModuleId);
      }
      configurations.push(extraConfiguration);
    }

    crntPath = crntPath + '/..';
  }

  var configuration = Object.assign.apply(Object, configurations);
  if (configuration.plugins &&
    configuration.plugins[0] &&
    configuration.plugins[0][0] === 'system-import-transformer') {
    configuration.plugins[0][0] = pluginPath;
  }
  return configuration;
}

function runTest(dir) {
  var configuration = getBabelConfiguration(dir);
  // console.log(JSON.stringify(configuration));
  var output = babel.transformFileSync(dir.path + '/actual.js', configuration);
  var expected = fs.readFileSync(dir.path + '/expected.js', 'utf-8');

  function normalizeLines(str) {
    // normalize line breaks
    var result = str.trimRight().replace(/\r\n/g, '\n')
      // split ternary operator
      .replace(/[?][^\n]/g, '?\n')
      .replace(/[:][^\n]/g, ':\n');

    // remove comments
    result = result.replace(/(\/\/.*?)[\r\n]/g, '');
    result = result.replace(/(\/\/.*?)$/g, '');

    // format the code
    result = beautify(result, { indent_size: 4 });

    // remove extra line breaks
    result = result.replace(/\n+/g, '\n');

    return result;
  }

  process.stdout.write(chalk.bgWhite.black(dir.relativeName));
  process.stdout.write('\n');

  var d = diff.diffLines(normalizeLines(output.code), normalizeLines(expected));
  if (!(d.length === 1 && !d[0].added && !d[0].removed)) {
    d.forEach(function (part) {
      var value = part.value;
      if (part.added) {
        value = chalk.green(part.value);
      } else if (part.removed) {
        value = chalk.red(part.value);
      }


      process.stdout.write(value);
    });
    process.stdout.write('\n\n\n');
    return false;
  }
  return true;
}

if (process.argv.indexOf('--watch') >= 0) {
  require('watch').watchTree(__dirname + '/..', function () {
    delete require.cache[pluginPath];
    clear();
    console.log('Press Ctrl+C to stop watching...');
    console.log('================================');
    try {
      runTests();
    } catch (e) {
      console.error(chalk.magenta(e.stack));
    }
  });
} else {
  var failedTests = runTests();
  if (failedTests) {
    throw new Error(failedTests + ' tests Failed');
  }
}
