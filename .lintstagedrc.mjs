import path from 'node:path';

const capiSource = `${path.sep}apps${path.sep}capi${path.sep}`;
const cfeSource = `${path.sep}apps${path.sep}cfe${path.sep}`;
const quote = (files) => files.map((file) => `"${file}"`).join(' ');

const isCapiTypeScript = (file) => file.includes(capiSource) && file.endsWith('.ts');
const isCfeLinted = (file) =>
  file.includes(`${cfeSource}src${path.sep}`) && (file.endsWith('.ts') || file.endsWith('.html'));

export default {
  // ESLint runs Prettier itself (eslint-plugin-prettier), so capi TS files skip the plain Prettier pass.
  '*.{ts,js,mjs,html,css,json}': (files) => {
    const capiFiles = files.filter(isCapiTypeScript);
    const otherFiles = files.filter((file) => !isCapiTypeScript(file));
    const cfeFiles = files.filter(isCfeLinted);
    const commands = [];

    // cfe ESLint (angular-eslint, incl. template accessibility rules) does not run Prettier,
    // so its files also get the plain Prettier pass below.
    if (cfeFiles.length > 0) {
      commands.push(
        `apps/cfe/node_modules/.bin/eslint --fix --config apps/cfe/eslint.config.js ${quote(cfeFiles)}`,
      );
    }
    if (capiFiles.length > 0) {
      commands.push(`apps/capi/node_modules/.bin/eslint --fix ${quote(capiFiles)}`);
    }
    if (otherFiles.length > 0) {
      commands.push(`prettier --write ${quote(otherFiles)}`);
    }

    return commands;
  },
};
