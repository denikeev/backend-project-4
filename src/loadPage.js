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
  console.log('err>>>', err);
  console.log('errMessage>>>', err.message);
  console.log('errCode>>', err.code);
  if (err.response) {
    if (err.response.status === 404) {
      throw new Error(err.message, { cause: { code: err.response.status } });
    }
    if (err.response.status === 500) {
      throw new Error(err.message, { cause: { code: err.response.status } });
    }
  }
  if (err.code === 'ENOENT') {
    console.log('this');
    throw new Error(err.message, { cause: { code: err.code } });
  }
  throw new Error('Unknown Error', { cause: { code: 1 } });
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
    if (err.code === 'ERR_INVALID_URL') {
      throw new Error(`URL ${address} is invalid`, { cause: { code: err.code } });
    }
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
