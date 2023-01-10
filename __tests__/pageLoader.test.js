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
  originHtml = await fs.readFile(getFixturePath('before.html'));
  expectedHtml = await fs.readFile(getFixturePath('after.html'));
  expectedImg = await fs.readFile(getFixturePath('image.png'));
  expectedStyle = await fs.readFile(getFixturePath('application.css'));
  expectedScript = await fs.readFile(getFixturePath('script.js'));
  nock('https://ru.hexlet.io').get('/courses').reply(200, originHtml);
  nock('https://ru.hexlet.io').get('/courses').reply(200, originHtml);
  nock('https://ru.hexlet.io').get('/assets/professions/nodejs.png').reply(200, expectedImg);
  nock('https://ru.hexlet.io').get('/assets/application.css').reply(200, expectedStyle);
  nock('https://ru.hexlet.io').get('/packs/js/runtime.js').reply(200, expectedScript);
  destPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

const loadActualData = async () => Promise.all([
  fs.access(path.join(destPath, dirname)),
  fs.readFile(path.join(destPath, 'ru-hexlet-io-courses.html')),
  fs.readFile(path.join(destPath, dirname, 'ru-hexlet-io-assets-professions-nodejs.png')),
  fs.readFile(path.join(destPath, dirname, 'ru-hexlet-io-assets-application.css')),
  fs.readFile(path.join(destPath, dirname, 'ru-hexlet-io-courses.html')),
  fs.readFile(path.join(destPath, dirname, 'ru-hexlet-io-packs-js-runtime.js')),
]);

test('loadPage main flow', async () => {
  await loadPage('https://ru.hexlet.io/courses', destPath);
  const [directory, html, img, style, canonicalHtml, script] = await loadActualData();

  expect(directory).toBeUndefined();
  expect(html).toEqual(expectedHtml);
  expect(img).toEqual(expectedImg);
  expect(style).toEqual(expectedStyle);
  expect(canonicalHtml).toEqual(originHtml);
  expect(script).toEqual(expectedScript);
});

const errorCases = [
  ["Page 'undefined' not found [404]", 'https://example.com/notfoundpage', getTempDir(), 404],
  ['Internal server error on page undefined [500]', 'https://example.com/internalservererr', getTempDir(), 500],
  ['Invalid URL', 'example.com', null, null],
  ["ENOENT: no such file or directory, open '/unknown/example.html'", 'https://example.com', '/unknown', 200],
  ["EACCES: permission denied, open '/etc/example.html'", 'https://example.com', '/etc', 200],
];

describe('loadPage throws', () => {
  test.each(errorCases)('%s', async (expected, address, dir, code) => {
    expect.assertions(1);
    const directory = dir instanceof Promise ? await dir : dir;
    if (code !== null) {
      const currentUrl = new URL(address);
      nock(currentUrl.origin).get(currentUrl.pathname).reply(code);
    }

    await expect(loadPage(address, directory)).rejects.toThrow(expected);
  });
});
