import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import nock from 'nock';

import pageLoader from '../src/pageLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getFixturePath = (file) => path.join(__dirname, '..', '__fixtures__', file);

let expected;
let destPath;
const url = new URL('https://ru.hexlet.io/courses');

beforeAll(async () => {
  expected = await fs.readFile(getFixturePath('index.html'), 'utf-8');
});

beforeEach(async () => {
  destPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('pageLoader', async () => {
  nock(url.origin)
    .get(url.pathname)
    .reply(200, expected);
  const filename = await pageLoader(url, destPath);
  const actual = await fs.readFile(path.join(destPath, filename), 'utf-8');
  expect(actual).toBe(expected);
});
