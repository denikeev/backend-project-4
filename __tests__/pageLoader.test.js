import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import nock from 'nock';

import loadPage from '../src/loadPage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFixturePath = (file) => path.join(__dirname, '..', '__fixtures__', file);

let beforeHtml;
let expectedHtml;
let expectedImg;
let expectedStyle;
let expectedScript;
let destPath;
const url = new URL('https://ru.hexlet.io/courses');
const imageUrl = new URL('https://ru.hexlet.io/assets/professions/nodejs.png');
const styleUrl = new URL('https://ru.hexlet.io/assets/application.css');
const scriptUrl = new URL('https://ru.hexlet.io/packs/js/runtime.js');
const htmlFilename = 'ru-hexlet-io-courses.html';
const imgFilename = 'ru-hexlet-io-assets-professions-nodejs.png';
const styleFilename = 'ru-hexlet-io-assets-application.css';
const canonicalFilename = 'ru-hexlet-io-courses.html';
const jsFilename = 'ru-hexlet-io-packs-js-runtime.js';
const dirname = 'ru-hexlet-io-courses_files';

beforeAll(async () => {
  beforeHtml = await fs.readFile(getFixturePath('before.html'), 'utf-8');
  expectedHtml = await fs.readFile(getFixturePath('after.html'), 'utf-8');
  expectedImg = await fs.readFile(getFixturePath('image.png'));
  expectedStyle = await fs.readFile(getFixturePath('application.css'), 'utf-8');
  expectedScript = await fs.readFile(getFixturePath('script.js'), 'utf-8');
  nock(url.origin).get(url.pathname).reply(200, beforeHtml);
  nock(url.origin).get(url.pathname).reply(200, beforeHtml);
  nock(imageUrl.origin).get(imageUrl.pathname).reply(200, expectedImg);
  nock(styleUrl.origin).get(styleUrl.pathname).reply(200, expectedStyle);
  nock(scriptUrl.origin).get(scriptUrl.pathname).reply(200, expectedScript);
  destPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  await loadPage(url, destPath);
});

test('loadPage html', async () => {
  const actual = await fs.readFile(path.join(destPath, htmlFilename), 'utf-8');
  expect(actual.trim()).toBe(expectedHtml);
});

test('loadPage files dir', async () => {
  const actual = await fs.access(path.join(destPath, dirname));
  expect(actual).toBeUndefined();
});

test('loadPage img', async () => {
  const actual = await fs.readFile(path.join(destPath, dirname, imgFilename));
  expect(actual).toEqual(expectedImg);
});

test('loadPage link', async () => {
  const actual = await fs.readFile(path.join(destPath, dirname, styleFilename), 'utf-8');
  expect(actual).toBe(expectedStyle);
});

test('loadPage canonical', async () => {
  const actual = await fs.readFile(path.join(destPath, dirname, canonicalFilename), 'utf-8');
  expect(actual).toBe(beforeHtml);
});

test('loadPage script', async () => {
  const actual = await fs.readFile(path.join(destPath, dirname, jsFilename), 'utf-8');
  expect(actual).toBe(expectedScript);
});
