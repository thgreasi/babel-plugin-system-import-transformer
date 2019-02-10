const babel = require('@babel/core');
const chalk = require('chalk');
const clear = require('clear');
const diff = require('diff');
const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

require('@babel/register');

const pluginPath = require.resolve('../.');

function traverseFolders(dir) {
  if (!fs.statSync(dir.path).isDirectory()) {
    return [];
  }

  const innerFolders = fs
    .readdirSync(dir.path)
    .map(function(item) {
      return {
        path: path.join(dir.path, item),
        name: item,
        relativeName: dir.relativeName ? dir.relativeName + '/' + item : item,
      };
    })
    .filter(function(item) {
      return fs.statSync(item.path).isDirectory();
    });

  if (!innerFolders.length) {
    return [dir];
  } else {
    return innerFolders.map(traverseFolders).reduce(function(aggr, crnt) {
      return aggr.concat(crnt);
    }, []);
  }
}

function runTests() {
  const testsPath = __dirname + '/fixtures/';

  const fixtureFolders = traverseFolders({
    path: testsPath,
    name: 'fixtures',
    relativeName: '',
  });

  const result = fixtureFolders
    .filter(function(dir) {
      return dir.name[0] !== '_';
    })
    .map(runTest)
    .reduce(function(aggr, crnt) {
      return aggr + !crnt;
    }, 0);
  return result;
}

function createBabelModuleIdProvider(fileMap) {
  return function babelModuleIdProvider(moduleName) {
    // const fileMap = {
    //   'myModule': 'myModuleGlobalconst'
    // };

    const result = fileMap[moduleName] || moduleName.replace('src/', '');
    return result;
  };
}

function getBabelConfiguration(dir) {
  const defaultConfiguration = {
    plugins: [pluginPath],
  };
  const configurations = [defaultConfiguration];

  let crntPath = dir.path;
  for (let i = 0, len = 2; i < len; i++) {
    let extraConfiguration = {};
    const babelrcPath = crntPath + '/.babelrc_extra';
    if (fs.existsSync(babelrcPath)) {
      extraConfiguration = JSON.parse(fs.readFileSync(babelrcPath, 'utf8'));
      if (extraConfiguration.getModuleId) {
        extraConfiguration.getModuleId = createBabelModuleIdProvider(
          extraConfiguration.getModuleId,
        );
      }
      configurations.push(extraConfiguration);
    }

    crntPath = crntPath + '/..';
  }

  const configuration = Object.assign.apply(Object, configurations);
  if (
    configuration.plugins &&
    configuration.plugins[0] &&
    configuration.plugins[0][0] === 'system-import-transformer'
  ) {
    configuration.plugins[0][0] = pluginPath;
  }
  return configuration;
}

const prettierConfigPath = path.join(__dirname, '../.prettierrc');
const prettierConfig = JSON.parse(fs.readFileSync(prettierConfigPath, 'utf-8'));

function formatCode(str) {
  // normalize line breaks
  let result = str
    .trimRight()
    .replace(/\r\n/g, '\n')
    // remove comments
    .replace(/(\/\/.*?)[\r\n]/g, '')
    .replace(/(\/\/.*?)$/g, '');

  // format the code
  result = prettier
    .format(result, prettierConfig)
    // remove extra line breaks
    .replace(/\n+/g, '\n');

  return result;
}

function runTest(dir) {
  const configuration = getBabelConfiguration(dir);
  const output = babel.transformFileSync(
    dir.path + '/actual.js',
    configuration,
  );
  const expected = fs.readFileSync(dir.path + '/expected.js', 'utf-8');

  process.stdout.write(chalk.bgWhite.black(dir.relativeName));
  process.stdout.write('\n');

  const d = diff.diffLines(formatCode(output.code), formatCode(expected));
  if (!(d.length === 1 && !d[0].added && !d[0].removed)) {
    d.forEach(function(part) {
      let value = part.value;
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
  require('watch').watchTree(__dirname + '/..', function() {
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
  const failedTests = runTests();
  if (failedTests) {
    throw new Error(failedTests + ' tests Failed');
  }
}
