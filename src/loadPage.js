import 'axios-debug-log';
import axios from 'axios';
import prettier from 'prettier';
import debug from 'debug';

import fs from 'fs/promises';
import path from 'path';

import parseHtml from './parseHtml.js';
import getFileName from './getFileName.js';

const log = debug('page-loader');

const handleErrors = (err) => {
  const getError = (message = 'Unknown Error') => new Error(message, { cause: err });
  const errors = ['ERR_INVALID_URL', 'ENOENT', 'EACCES'];
  let message = '';

  if (err.response) {
    if (err.response.status === 404) {
      message = `Page '${err.config.url.href}' not found [404]`;
    }
    if (err.response.status === 500) {
      message = `Internal server error on page ${err.config.url.href} [500]`;
    }
  }
  if (errors.includes(err.code)) {
    message = err.message;
  }

  throw getError(message);
};

const getSources = (resources) => {
  const keys = Object.keys(resources);
  const requests = keys
    .flatMap((key) => resources[key].urls.map((url) => {
      const options = key === 'images' ? { responseType: 'arraybuffer' } : {};
      return axios.get(url, options);
    }));
  const newFilepaths = keys.flatMap((key) => resources[key].newFilepaths);

  return { requests, newFilepaths };
};

export default (address, dirpath = process.cwd()) => {
  log(`URL ${address}`);
  log(`Output dir ${dirpath}`);

  let url;
  try {
    url = new URL(address);
  } catch (err) {
    handleErrors(err);
  }
  const { hostname, pathname } = url;
  const mainPath = path.join(hostname, pathname);
  const htmlFilename = getFileName(mainPath, '.html');
  const filesPath = getFileName(mainPath, '_files');
  const htmlPath = path.join(dirpath, htmlFilename);
  let newSourses;
  let promises;

  return axios.get(url)
    .then((response) => {
      const { html, resources } = parseHtml(
        response.data,
        url,
        filesPath,
      );
      const { requests, newFilepaths } = getSources(resources);
      const prettifiedHtml = prettier.format(html, {
        parser: 'html',
        printWidth: Infinity,
      });
      const htmlPromise = fs.writeFile(htmlPath, prettifiedHtml);
      promises = Promise.all([htmlPromise, ...requests]);
      if (requests.length > 0) {
        log(`has requests, requests length: ${requests.length}`);
        newSourses = newFilepaths;
        return fs.mkdir(path.join(dirpath, filesPath));
      }
      return Promise.resolve();
    })
    .then(() => promises)
    .then((responses) => {
      const [, ...restResponses] = responses;
      restResponses.forEach((response, i) => {
        const filepath = path.join(dirpath, filesPath, newSourses[i]);
        fs.writeFile(filepath, response.data);
      });
      log('page loaded');
    })
    .catch(handleErrors);
};
