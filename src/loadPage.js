import 'axios-debug-log';
import axios from 'axios';
import prettier from 'prettier';
import debug from 'debug';

import fs from 'fs/promises';
import path from 'path';

import parseHtml from './parseHtml.js';
import getFileName from './getFileName.js';

const log = debug('page-loader');

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

  const url = new URL(address);
  const { hostname, pathname } = url;
  const mainPath = path.join(hostname, pathname);
  const htmlFilename = getFileName(mainPath, '.html');
  const directoryPath = getFileName(mainPath, '_files');
  const htmlPath = path.join(dirpath, htmlFilename);
  let newSourses;

  return axios.get(url)
    .then((response) => {
      const { html, resources } = parseHtml(
        response.data,
        url,
        directoryPath,
      );
      const { requests, newFilepaths } = getSources(resources);
      const promises = Promise.all(requests);
      const prettifiedHtml = prettier.format(html, {
        parser: 'html',
        printWidth: Infinity,
      });
      fs.writeFile(htmlPath, prettifiedHtml);
      if (requests.length > 0) {
        log(`has requests, requests length: ${requests.length}`);
        fs.mkdir(path.join(dirpath, directoryPath));
        newSourses = newFilepaths;
      }
      return promises;
    })
    .then((responses) => {
      responses.forEach((response, i) => {
        const filepath = path.join(dirpath, directoryPath, newSourses[i]);
        fs.writeFile(filepath, response.data);
      });
    })
    .then(() => {
      log('page loaded');
    });
};
