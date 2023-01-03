#!/usr/bin/env node

import { Command } from 'commander';
import loadPage from '../src/loadPage.js';

const program = new Command();

const currentDir = process.cwd();

program
  .description('Page loader utility')
  .version('0.0.1')
  .option('-o, --output [dir]', 'output dir', currentDir)
  .argument('<url>')
  .action((url) => loadPage(url, `${program.opts().output}`));

program.parseAsync()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
