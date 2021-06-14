import path from 'path';
import fs from 'fs-extra';
import { markdownConfig } from '~/config';
import { split } from '~/split';

const rootPath = path.resolve(__dirname, '..');

describe('split()', () => {
  it('should split file', async () => {
    const inputPath = path.resolve(rootPath, 'tests/mock/hello.md');
    const outputPath = path.resolve(rootPath, '.tmp/tests/split');
    const results = await split(
      inputPath,
      outputPath,
      (await fs.readFile(inputPath)).toString(),
      markdownConfig
    );
    expect(results.inputPath).toBe(inputPath);
    expect(results.outputPath).toBe(outputPath);
    expect(results.extension).toBe('md');
    expect(results.parts).toMatchObject([
      {
        format: 'frontmatter',
        match: `---
hello: world
preprocess: true
---

`
      },
      { format: 'md' },
      {
        format: 'rst',
        match: `
.. rst::example`
      },
      { format: 'md' }
    ]);
  });
});
