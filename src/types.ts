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
