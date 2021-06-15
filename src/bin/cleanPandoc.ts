import fs from 'fs-extra';
import path from 'path';

(async () => {
  if (process.argv.length < 3) throw new Error('missing file path');
  const filePath = path.resolve(process.cwd(), process.argv[2]);
  let body = (await fs.readFile(filePath)).toString();
  body = body.replace(/^<div(>|\s).*\n?/g, '');
  body = body.replace(/\n<div(>|\s).*\n?/g, '');
  body = body.replace(/\n<\/div>.*\n?/g, '');
  body = body.replace(
    /# \[.+]\(\.\.\/.+\.html\)(\n|\s)+### Navigation(.|\n)*/g,
    ''
  );
  body = body.replace(/<a href="[^>]+>(\s|\n)*¶(\s|\n)*<\/a>/g, '');
  await fs.writeFile(filePath, body);
})();
