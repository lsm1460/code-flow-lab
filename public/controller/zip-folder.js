const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const JSZip = require('jszip');

/**
 * Compresses a folder to the specified zip file.
 * @param {string} srcDir
 * @param {string} destFile
 */
const compressFolder = async (srcDir, destFile) => {
  //node write stream wants dest dir to already be created
  await fsp.mkdir(path.dirname(destFile), { recursive: true });

  const zip = await createZipFromFolder(srcDir);

  return new Promise((resolve, reject) => {
    zip
      .generateNodeStream({ streamFiles: true, compression: 'DEFLATE' })
      .pipe(fs.createWriteStream(destFile))
      .on('error', (err) => reject(err))
      .on('finish', resolve);
  });
};

/**
 * Returns a flat list of all files and subfolders for a directory (recursively).
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const getFilePathsRecursively = async (dir) => {
  // returns a flat array of absolute paths of all files recursively contained in the dir
  const list = await fsp.readdir(dir);
  const statPromises = list.map(async (file) => {
    const fullPath = path.resolve(dir, file);
    const stat = await fsp.stat(fullPath);
    if (stat && stat.isDirectory()) {
      return getFilePathsRecursively(fullPath);
    }
    return fullPath;
  });

  // cast to string[] is ts hack
  // see: https://github.com/microsoft/TypeScript/issues/36554
  return (await Promise.all(statPromises)).flat(Number.POSITIVE_INFINITY);
};

/**
 * Creates an in-memory zip stream from a folder in the file system
 * @param {string} dir
 * @returns {Promise<JSZip>}
 */
const createZipFromFolder = async (dir, excludePath = []) => {
  const absRoot = path.resolve(dir);
  const filePaths = await getFilePathsRecursively(dir);

  return filePaths.reduce((z, filePath) => {
    for (let _p of excludePath) {
      if (filePath.endsWith(_p)) {
        return z;
      }
    }

    const relative = filePath.replace(absRoot, '');

    return z.file(relative, fs.createReadStream(filePath));
  }, new JSZip());
};

module.exports = { compressFolder, createZipFromFolder };
