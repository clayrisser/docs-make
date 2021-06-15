import YAML from 'yaml';
import fs from 'fs-extra';
import path from 'path';
import { Config, HashMap, Results, Query, Formatter, Part } from '~/types';

export async function splitAll(
  inputPaths: string[],
  outputPath: string,
  config: Config
) {
  const resultsMap: HashMap<Results> = {};
  await Promise.all(
    inputPaths.map(async (inputPath: string) => {
      const body = (await fs.readFile(inputPath)).toString();
      const results = await split(
        path.resolve(process.cwd(), inputPath),
        path.resolve(process.cwd(), outputPath, inputPath),
        body,
        config
      );
      resultsMap[inputPath] = results;
    })
  );
  return resultsMap;
}

export async function split(
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
      `${results.parts.length.toString().padStart(4, '0')}.${extension}`
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

export function getFrontmatter(results: Results) {
  let frontmatterStr = '';
  results.parts.forEach((part: Part) => {
    if (part.format === 'frontmatter') frontmatterStr = part.match || '';
  });
  frontmatterStr = frontmatterStr
    .replace(/^---+\s*\n/g, '')
    .replace(/\n---+(\s|\n)*$/g, '');
  return YAML.parse(frontmatterStr) || {};
}

export async function writeSplit(input: HashMap<Results>) {
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
