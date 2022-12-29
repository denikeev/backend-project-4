import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const getFileName = (address) => {
  const url = new URL(address);
  const { href, hostname } = url;
  const hostnameIndex = href.indexOf(hostname);
  const urlWithoutProtocol = href.slice(hostnameIndex);

  const parts = urlWithoutProtocol.match(/[0-9a-z]+/g);
  const filename = `${parts.join('-')}.html`;

  return filename;
};

const pageLoader = (url, dirpath = process.cwd()) => {
  const filename = getFileName(url);

  return axios.get(url)
    .then((response) => {
      const outputPath = path.join(dirpath, filename);
      return fs.writeFile(outputPath, response.data);
    })
    .then(() => filename);
};

export default pageLoader;
