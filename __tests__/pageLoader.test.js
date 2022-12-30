import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import nock from 'nock';

import pageLoader from '../src/pageLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFixturePath = (file) => path.join(__dirname, '..', '__fixtures__', file);

let expectedHtml;
let expectedImg;
let destPath;
const url = new URL('https://ru.hexlet.io/courses');
const imageUrl = new URL('https://ru.hexlet.io/assets/professions/nodejs.png');
const htmlFilename = 'ru-hexlet-io-courses.html';
const imgFilename = 'ru-hexlet-io-assets-professions-nodejs.png';
const dirname = 'ru-hexlet-io-courses_files';

beforeAll(async () => {
  const before = await fs.readFile(getFixturePath('before.html'), 'utf-8');
  expectedHtml = await fs.readFile(getFixturePath('after.html'), 'utf-8');
  expectedImg = await fs.readFile(getFixturePath('image.png'));
  nock(url.origin)
    .get(url.pathname)
    .reply(200, before);
  nock(imageUrl.origin)
    .get(imageUrl.pathname)
    .reply(200, expectedImg);
  destPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  await pageLoader(url, destPath);
});

test('pageLoader html', async () => {
  const actual = await fs.readFile(path.join(destPath, htmlFilename), 'utf-8');
  expect(actual).toBe(expectedHtml);
});

test('pageLoader files dir', async () => {
  const actual = await fs.access(path.join(destPath, dirname));
  expect(actual).toBeUndefined();
});

test('pageLoader img', async () => {
  const actual = await fs.readFile(path.join(destPath, dirname, imgFilename));
  expect(actual).toEqual(expectedImg);
});
