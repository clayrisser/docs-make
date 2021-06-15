import fs from 'fs-extra';
import { load } from 'cheerio';
import path from 'path';

(async () => {
  if (process.argv.length < 3) throw new Error('missing file path');
  const filePath = path.resolve(process.cwd(), process.argv[2]);
  let body = (await fs.readFile(filePath)).toString();
  const $ = load(body);
  body = $('body .document .body').html() || body;
  await fs.writeFile(filePath, body);
})();
