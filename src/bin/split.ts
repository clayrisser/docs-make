import fs from 'fs-extra';
import path from 'path';
import { markdownConfig, rstConfig } from '~/config';
import { splitAll, writeSplit } from '~/split';

const logger = console;

(async () => {
  if (process.argv.length < 3) {
    throw new Error('missing output path');
  } else if (process.argv.length < 4) {
    throw new Error('missing input paths');
  }
  const [, , outputPath, configPath] = process.argv;
  let config = markdownConfig;
  if (configPath === 'rst') {
    config = rstConfig;
  } else if (configPath && configPath.length && configPath.indexOf('.') > -1) {
    const extension = configPath.replace(/^.*\./g, '');
    const fullConfigPath = path.resolve(process.cwd(), configPath);
    if (extension === 'js') {
      config = await import(fullConfigPath);
    } else {
      config = await fs.readJSON(fullConfigPath);
    }
  }
  const inputPaths = process.argv.slice(3).map((inputPath) => inputPath);
  const results = await writeSplit(
    await splitAll(inputPaths, outputPath, config)
  );
  const splitJsonPath = path.resolve(outputPath, 'split.json');
  if (!(await fs.pathExists(splitJsonPath))) {
    await fs.writeFile(splitJsonPath, '{}');
  }
  const splitJson = await fs.readJSON(splitJsonPath);
  await fs.writeFile(
    splitJsonPath,
    JSON.stringify(Object.assign(splitJson, results), null, 2)
  );
})().catch(logger.error);
