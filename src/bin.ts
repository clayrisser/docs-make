import fs from 'fs-extra';
import path from 'path';
import { defaultConfig } from '~/config';
import { splitAll, writeSplit } from '~/split';

(async () => {
  if (process.argv.length < 3) {
    throw new Error('missing output path');
  } else if (process.argv.length < 4) {
    throw new Error('missing input paths');
  }
  const [, , outputPath] = process.argv;
  const inputPaths = process.argv.slice(3).map((inputPath) => inputPath);
  const results = await writeSplit(
    await splitAll(inputPaths, outputPath, defaultConfig)
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
})();
