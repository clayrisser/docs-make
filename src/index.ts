import YAML from 'yaml';
import fs from 'fs-extra';
import path from 'path';

const config = {
  formatters: {
    frontmatter: {
      queries: [/^---+\s*\n(.|\n)*?\n---+\s*/g],
      options: {
        preprocess: true
      }
    },
    rst: {
      queries: [/\n\.\.\s[a-zA-Z].*((\n|\s)*\n\s\s.*)*/g],
      options: {
        preprocess: true
      }
    }
  },
  defaultOptions: {
    preprocess: false
  }
};

async function main(config: Config) {
  if (process.argv.length < 3) {
    throw new Error('missing output path');
  } else if (process.argv.length < 4) {
    throw new Error('missing input paths');
  }
  const [, , outputPath] = process.argv;
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
}

async function splitAll(
  inputPaths: string[],
  outputPath: string,
  config: Config
) {
  const results: HashMap<Results> = {};
  await Promise.all(
    inputPaths.map(async (inputPath: string) => {
      const f = await fs.readFile(inputPath);
      const body = f.toString();
      const results = await split(
        path.resolve(process.cwd(), inputPath),
        path.resolve(process.cwd(), outputPath, inputPath),
        body,
        config
      );
      results[inputPath] = results;
    })
  );
  return results;
}

async function split(
  inputPath: string,
  outputPath: string,
  body: string,
  config: Config
) {
  const extension = inputPath.replace(/^.*\./, '');
  const results: Results = {
    body,
    extension,
    frontmatter: {},
    inputPath,
    outputPath,
    parts: []
  };
  Object.entries(config.formatters).forEach(
    ([formatName, formatter]: [string, Formatter]) => {
      formatter.queries.forEach((query: Query) => {
        const matches = Array.from(body.match(query) || []);
        matches.forEach((match: string) => {
          const from = body.indexOf(match);
          const { length } = match;
          const prevBody = body.substr(0, from);
          if (prevBody.length) {
            results.parts.push({
              format: extension,
              match: prevBody,
              path: path.resolve(
                outputPath,
                `${results.parts.length
                  .toString()
                  .padStart(4, '0')}.${extension}`
              ),
              ...config.defaultOptions
            });
          }
          body = body.substr(from + length);
          results.parts.push({
            format: formatName,
            path: path.resolve(
              outputPath,
              `${results.parts.length
                .toString()
                .padStart(4, '0')}.${formatName}`
            ),
            match,
            query: query.toString(),
            ...formatter.options
          });
        });
      });
    }
  );
  results.parts.push({
    match: body,
    format: extension,
    path: path.resolve(
      outputPath,
      results.parts.length.toString().padStart(4, '0')
    ),
    ...config.defaultOptions
  });
  const frontmatter = getFrontmatter(results);
  results.frontmatter = frontmatter;
  results.parts = results.parts.map((part) => {
    part.preprocess = !!frontmatter.preprocess || false;
    return part;
  });
  return results;
}

function getFrontmatter(results: Results) {
  let frontmatterStr = '';
  results.parts.forEach((part: Part) => {
    if (part.format === 'frontmatter') frontmatterStr = part.match || '';
  });
  frontmatterStr = frontmatterStr
    .replace(/^---+\s*\n/g, '')
    .replace(/\n---+(\s|\n)*$/g, '');
  return YAML.parse(frontmatterStr) || {};
}

async function writeSplit(input: HashMap<Results>) {
  await Promise.all(
    Object.values(input).map(async (results: Results) => {
      const { outputPath, frontmatter } = results;
      await fs.mkdirp(outputPath);
      if (!frontmatter.preprocess) {
        results.parts = [
          {
            format: results.extension,
            match: results.body,
            path: path.resolve(results.outputPath, `0000.${results.extension}`),
            preprocess: false
          }
        ];
      }
      delete results.body;
      return Promise.all(
        results.parts.map((part: Part) => {
          const body = part.match;
          delete part.match;
          return fs.writeFile(part.path, body);
        })
      );
    })
  );
  return input;
}

main(config);

export interface Formatters {
  [formatterName: string]: Formatter;
}

export type Query = RegExp | string;

export interface Formatter {
  options?: Options;
  queries: Query[];
}

export interface Options {
  preprocess: boolean;
}

export interface Config {
  formatters: Formatters;
  defaultOptions: Options;
}

export interface HashMap<T = any> {
  [key: string]: T;
}

export interface Results {
  body?: string;
  extension: string;
  frontmatter: HashMap<Options>;
  inputPath: string;
  outputPath: string;
  parts: Part[];
}

export interface Part {
  format: string;
  match?: string;
  path: string;
  preprocess?: boolean;
  query?: Query;
}
