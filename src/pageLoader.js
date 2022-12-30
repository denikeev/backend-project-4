import axios from 'axios';
import cheerio from 'cheerio';
import prettier from 'prettier';

import fs from 'fs/promises';
import path from 'path';

const getUrlParts = (address) => {
  const url = new URL(address);
  const { href, hostname, origin } = url;
  const hostnameIndex = href.indexOf(hostname);
  const truncatedUrl = href.slice(hostnameIndex);

  return { hostname, truncatedUrl, origin };
};

const getFileName = (url, ext, hostname = '') => {
  const regex = /[0-9a-z]+/g;
  const parts = url.match(regex);
  const processedHostname = hostname ? hostname.match(regex) : [];
  const dir = [...processedHostname, ...parts].join('-');
  const filename = `${dir}${ext}`;

  return filename;
};

const parseHtml = (html, directoryName, hostname) => {
  const $ = cheerio.load(html);
  const filepaths = [];
  const newFilepaths = [];

  $('img[src]').each((_, el) => {
    const currentSrc = $(el).attr('src');
    filepaths.push(currentSrc);
    const { dir, name, ext } = path.parse(currentSrc);
    const dirWithName = path.join(dir, name);
    const newSrc = getFileName(dirWithName, ext, hostname);
    newFilepaths.push(newSrc);
    $(el).attr('src', path.join(directoryName, newSrc));
    return el;
  });

  return { html: $.html(), filepaths, newFilepaths };
};

const pageLoader = (url, dirpath = process.cwd()) => {
  const { truncatedUrl, hostname, origin } = getUrlParts(url);
  const filename = getFileName(truncatedUrl, '.html');
  const directoryName = getFileName(truncatedUrl, '_files');
  const outputPath = path.join(dirpath, filename);
  let newSourses;

  return axios.get(url)
    .then((response) => {
      const { html, newFilepaths, filepaths } = parseHtml(
        response.data,
        directoryName,
        hostname,
      );
      const originSources = filepaths.map((elPath) => path.join(origin, elPath));
      const promises = originSources.map((filepath) => axios.get(filepath, { responseType: 'arraybuffer' }));
      const prettifiedHtml = prettier.format(html, {
        parser: 'html',
        printWidth: Infinity,
      });
      fs.writeFile(outputPath, prettifiedHtml);
      if (originSources.length > 0) {
        fs.mkdir(path.join(dirpath, directoryName));
        newSourses = newFilepaths;
      }
      return Promise.all(promises);
    })
    .then((responses) => {
      responses.forEach((response, i) => {
        const filepath = path.join(dirpath, directoryName, newSourses[i]);
        fs.writeFile(filepath, response.data);
      });
    });
};

export default pageLoader;
