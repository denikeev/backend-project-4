import path from 'path';

const normalizePath = (filepath) => {
  const parts = filepath.split('.');
  return parts.slice(0, parts.length - 1).join('.');
};

const getFileName = (currentPath, ext = path.extname(currentPath)) => {
  const regex = /[0-9a-z]+/g;
  const normalizedPath = path.extname(currentPath) ? normalizePath(currentPath) : currentPath;

  const parts = normalizedPath.match(regex);
  const dir = parts.join('-');
  const currentExt = ext || '.html';
  const filename = `${dir}${currentExt}`;

  return filename;
};

export default getFileName;
