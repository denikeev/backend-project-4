import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import prettier from 'prettier';

const getUrlParts = (address) => {
  const url = new URL(address);
  const { href, hostname } = url;
  const hostnameIndex = href.indexOf(hostname);
  const truncatedUrl = href.slice(hostnameIndex);

  return { hostname, truncatedUrl };
};

const getFileName = (url, ext, hostname = '') => {
  const regex = /[0-9a-z]+/g;
  const parts = url.match(regex);
  const processedHostname = hostname ? hostname.match(regex) : [];
  const dir = [...processedHostname, ...parts].join('-');
  const filename = `${dir}${ext}`;

  return filename;
};

const editHtml = (html, directoryName, hostname) => {
  const $ = cheerio.load(html);

  $('img[src]').each((_, el) => {
    const currentSrc = $(el).attr('src');
    const { dir, name, ext } = path.parse(currentSrc);
    const dirWithName = path.join(dir, name);
    const newSrc = getFileName(dirWithName, ext, hostname);
    $(el).attr('src', path.join(directoryName, newSrc));
    return el;
  });

  return $.html();
};

const pageLoader = (url, dirpath = process.cwd()) => {
  const { truncatedUrl, hostname } = getUrlParts(url);
  const filename = getFileName(truncatedUrl, '.html');
  const directoryName = getFileName(truncatedUrl, '_files');
  const outputPath = path.join(dirpath, filename);

  return axios.get(url)
    .then((response) => {
      const editedHtml = editHtml(response.data, directoryName, hostname);
      return prettier.format(editedHtml, {
        parser: 'html',
        printWidth: Infinity,
      });
    })
    .then((prettifiedData) => fs.writeFile(outputPath, prettifiedData))
    .then(() => filename);
};

export default pageLoader;
