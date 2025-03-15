// @ts-check
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix --config eslint.config.mjs', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
};
