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

function runTests() {
  var testsPath = __dirname + '/fixtures/';

  var result = fs.readdirSync(testsPath).map(function(item) {
    return {
      path: path.join(testsPath, item),
      name: item,
    };
  }).filter(function(item) {
    return fs.statSync(item.path).isDirectory();
  }).map(runTest).reduce(function (aggr, crnt) {
    return aggr + !crnt;
  }, 0);
  return result;
}

function babelModuleIdProvider(moduleName) {
  var files = {
    'myModule': 'myModuleGlobalVar'
  };

  var result = files[moduleName] || moduleName.replace('src/', '');
  return result;
}

function runTest(dir) {
  var extraConfiguration = {};
  var babelrcPath = dir.path + '/.babelrc_extra';
  if (fs.existsSync(babelrcPath)) {
    extraConfiguration = JSON.parse(fs.readFileSync(babelrcPath, 'utf8'));
  }

  if (extraConfiguration.getModuleId) {
    extraConfiguration.getModuleId = babelModuleIdProvider;
  }

  var configuration = Object.assign({}, {
    plugins: [pluginPath]
  }, extraConfiguration);

  var output = babel.transformFileSync(dir.path + '/actual.js', configuration);

  var expected = fs.readFileSync(dir.path + '/expected.js', 'utf-8');

  function normalizeLines(str) {
    var result = str.trimRight().replace(/\r\n/g, '\n')
      .replace(/[?][^\n]/g, '?\n')
      .replace(/[:][^\n]/g, ':\n');

    result = beautify(result, { indent_size: 4 });

    return result;
  }

  process.stdout.write(chalk.bgWhite.black(dir.name));
  process.stdout.write('\n\n');

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
