import path from 'path';
import cheerio from 'cheerio';
import getFileName from './getFileName.js';

const parseHtml = (html, address, directoryPath) => {
  const $ = cheerio.load(html);
  const url = new URL(address);
  const { hostname, origin } = url;

  const getUrls = (sourseType, resource) => (_, el) => {
    const currentPath = $(el).attr(sourseType);
    const link = new URL(currentPath, origin);
    if (link.origin === origin) {
      resource.urls.push(link);
      const newPath = getFileName(path.join(hostname, link.pathname));
      resource.newFilepaths.push(newPath);
      $(el).attr(sourseType, path.join(directoryPath, newPath));

      return el;
    }

    return el;
  };

  const resources = {
    images: { urls: [], newFilepaths: [] },
    scripts: { urls: [], newFilepaths: [] },
    styles: { urls: [], newFilepaths: [] },
  };

  $('link[href]').each(getUrls('href', resources.styles));
  $('img[src]').each(getUrls('src', resources.images));
  $('script[src]').each(getUrls('src', resources.scripts));

  return { html: $.html(), resources };
};

export default parseHtml;
