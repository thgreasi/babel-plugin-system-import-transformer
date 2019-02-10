import { types as t } from './babelArgumentProvider';
import path from 'path';

function isRelativeImport(importPath) {
  // https://nodejs.org/api/modules.html#modules_all_together
  return importPath.startsWith('./') ||
         importPath.startsWith('/') ||
         importPath.startsWith('../');
}

function isNodeModuleImport(importPath) {
  return importPath.indexOf('/') === -1 ||
         !isRelativeImport(importPath);
}

function getImportPath(file, relativeImportPath) {
  const filename = file.opts.filename;
  const filePath = filename.replace(/[^\/]+$/, '');
  const result = path.join(filePath, relativeImportPath);
  return result;
}


function getImportedModuleFile(crntFile, importedModulePath) {
  // There should be a better way than cloning
  const importedModuleFile = {
    ...crntFile,
    opts: {
      ...crntFile.opts,
      filename: crntFile.opts.filenameRelative = importedModulePath + '.js',
    },
    getModuleName: crntFile.getModuleName,
  };

  // importedModuleFile.opts.moduleIds = true;\
  return importedModuleFile;
}

export function getImportModuleName(file, importPath) {
  // check if it is a relative path or a module name
  const importedModulePath = isNodeModuleImport(importPath) ?
    importPath :
    getImportPath(file, importPath);

  const importedModuleFile = getImportedModuleFile(file, importedModulePath);

  // Use the getModuleName()
  // so that the getModuleId configuration option is called
  const result = importedModuleFile.opts.moduleIds ?
    importedModuleFile.getModuleName() :
    importPath;
  return result;
}
