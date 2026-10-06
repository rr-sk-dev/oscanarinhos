import path from 'node:path';

const capiSource = `${path.sep}apps${path.sep}capi${path.sep}`;
const quote = (files) => files.map((file) => `"${file}"`).join(' ');

const isCapiTypeScript = (file) => file.includes(capiSource) && file.endsWith('.ts');

export default {
  // ESLint runs Prettier itself (eslint-plugin-prettier), so capi TS files skip the plain Prettier pass.
  '*.{ts,js,mjs,html,css,json}': (files) => {
    const capiFiles = files.filter(isCapiTypeScript);
    const otherFiles = files.filter((file) => !isCapiTypeScript(file));
    const commands = [];

    if (capiFiles.length > 0) {
      commands.push(`apps/capi/node_modules/.bin/eslint --fix ${quote(capiFiles)}`);
    }
    if (otherFiles.length > 0) {
      commands.push(`prettier --write ${quote(otherFiles)}`);
    }

    return commands;
  },
};
