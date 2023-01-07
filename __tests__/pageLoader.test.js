import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import nock from 'nock';

import loadPage from '../src/loadPage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFixturePath = (file) => path.join(__dirname, '..', '__fixtures__', file);

const getTempDir = async () => {
  await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
};

let originHtml;
let expectedHtml;
let expectedImg;
let expectedStyle;
let expectedScript;
let destPath;
const dirname = 'ru-hexlet-io-courses_files';

beforeAll(async () => {
  originHtml = await fs.readFile(getFixturePath('before.html'), 'utf-8');
  expectedHtml = await fs.readFile(getFixturePath('after.html'), 'utf-8');
  expectedImg = await fs.readFile(getFixturePath('image.png'));
  expectedStyle = await fs.readFile(getFixturePath('application.css'), 'utf-8');
  expectedScript = await fs.readFile(getFixturePath('script.js'), 'utf-8');
  nock('https://ru.hexlet.io').get('/courses').reply(200, originHtml);
  nock('https://ru.hexlet.io').get('/courses').reply(200, originHtml);
  nock('https://ru.hexlet.io').get('/assets/professions/nodejs.png').reply(200, expectedImg);
  nock('https://ru.hexlet.io').get('/assets/application.css').reply(200, expectedStyle);
  nock('https://ru.hexlet.io').get('/packs/js/runtime.js').reply(200, expectedScript);
  destPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  await loadPage('https://ru.hexlet.io/courses', destPath);
});

describe('loadPage main flow', () => {
  test('html', async () => {
    const actual = await fs.readFile(path.join(destPath, 'ru-hexlet-io-courses.html'), 'utf-8');
    expect(actual).toEqual(expectedHtml);
  });
  test('files dir', async () => {
    const actual = await fs.access(path.join(destPath, dirname));
    expect(actual).toBeUndefined();
  });
  test('img', async () => {
    const actual = await fs.readFile(path.join(destPath, dirname, 'ru-hexlet-io-assets-professions-nodejs.png'));
    expect(actual).toEqual(expectedImg);
  });
  test('link', async () => {
    const actual = await fs.readFile(path.join(destPath, dirname, 'ru-hexlet-io-assets-application.css'), 'utf-8');
    expect(actual).toEqual(expectedStyle);
  });
  test('canonical', async () => {
    const actual = await fs.readFile(path.join(destPath, dirname, 'ru-hexlet-io-courses.html'), 'utf-8');
    expect(actual).toEqual(originHtml);
  });
  test('script', async () => {
    const actual = await fs.readFile(path.join(destPath, dirname, 'ru-hexlet-io-packs-js-runtime.js'), 'utf-8');
    expect(actual).toEqual(expectedScript);
  });
});

const errorCases = [
  ['ERR_BAD_REQUEST', 'https://example.com/notfoundpage', getTempDir(), 404],
  ['ERR_BAD_RESPONSE', 'https://example.com/internalservererr', getTempDir(), 500],
  ['ERR_INVALID_URL', 'example.com', null, null],
  ['ENOENT', 'https://example.com', '/unknown', 200],
  ['EACCES', 'https://example.com', '/etc', 200],
];

describe('loadPage throws', () => {
  test.each(errorCases)('%s', async (expected, address, dir, code) => {
    expect.assertions(1);
    try {
      const directory = dir instanceof Promise ? await dir : dir;
      if (code !== null) {
        const currentUrl = new URL(address);
        nock(currentUrl.origin).get(currentUrl.pathname).reply(code);
        await loadPage(address, directory);
      } else {
        await loadPage(address, directory);
      }
    } catch ({ cause }) {
      expect(cause.code).toEqual(expected);
    }
  });
});
