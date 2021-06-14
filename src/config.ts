import { Config } from '~/types';

export const markdownConfig: Config = {
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

export const rstConfig: Config = {
  formatters: {
    frontmatter: {
      queries: [/^---+\s*\n(.|\n)*?\n---+\s*/g],
      options: {
        preprocess: true
      }
    }
  },
  defaultOptions: {
    preprocess: false
  }
};
