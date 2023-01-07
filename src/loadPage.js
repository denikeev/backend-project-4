import 'axios-debug-log';
import axios from 'axios';
import Listr from 'listr';
import prettier from 'prettier';
import debug from 'debug';

import fs from 'fs/promises';
import path from 'path';

import parseHtml from './parseHtml.js';
import getFileName from './getFileName.js';

const log = debug('page-loader');

const handleErrors = (err) => {
  const getError = (message = 'Unknown Error') => new Error(message, { cause: err });
  const errorCodes = ['ERR_INVALID_URL', 'ENOENT', 'EACCES'];
  let message = '';

  if (err.response) {
    if (err.response.status === 404) {
      message = `Page '${err.config.url.href}' not found [404]`;
    }
    if (err.response.status === 500) {
      message = `Internal server error on page ${err.config.url.href} [500]`;
    }
  }
  if (errorCodes.includes(err.code)) {
    message = err.message;
  }

  throw getError(message);
};

const getResourcePromises = (resources, dirpath, filesPath) => {
  const keys = Object.keys(resources);
  const resourcePromises = keys
    .flatMap((key) => resources[key].urls.map((url, index) => {
      const options = key === 'images' ? { responseType: 'arraybuffer' } : {};
      const filepath = path.join(dirpath, filesPath, resources[key].newFilepaths[index]);
      return {
        title: url.href,
        task: () => axios.get(url, options)
          .then((response) => fs.writeFile(filepath, response.data)),
      };
    }));

  return resourcePromises;
};

export default (address, dirpath = process.cwd()) => {
  log(`URL ${address}`);
  log(`Output dir ${dirpath}`);

  let promises;
  let htmlPath;

  return axios.get(address)
    .catch(handleErrors)
    .then((response) => {
      const url = new URL(address);
      const { hostname, pathname } = url;
      const mainPath = path.join(hostname, pathname);
      const htmlFilename = getFileName(mainPath, '.html');
      const filesPath = getFileName(mainPath, '_files');
      htmlPath = path.join(dirpath, htmlFilename);
      const { html, resources } = parseHtml(
        response.data,
        url,
        filesPath,
      );

      const resourcePromises = getResourcePromises(resources, dirpath, filesPath);
      const prettifiedHtml = prettier.format(html, { parser: 'html', printWidth: Infinity });
      const htmlPromise = {
        title: path.basename(htmlPath),
        task: () => fs.writeFile(htmlPath, prettifiedHtml).catch(handleErrors),
      };
      promises = new Listr([htmlPromise, ...resourcePromises], { concurrent: true });
      if (resourcePromises.length > 0) {
        log(`has resourcePromises, resourcePromises length: ${resourcePromises.length}`);
        return fs.mkdir(path.join(dirpath, filesPath))
          .catch(handleErrors);
      }
      return Promise.resolve();
    })
    .then(() => promises.run())
    .then(() => {
      console.log(`Page was successfully downloaded into '${htmlPath}'`);
    });
};
