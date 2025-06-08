const sharedOptions = require('@pag/eslint-config/shared');

/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	extends: ['@pag/eslint-config/node'],

	...sharedOptions(__dirname),
};
