module.exports = {
	env: {
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	parserOptions: {
		parser: '@typescript-eslint/parser',
		ecmaFeatures: {
			legacyDecorators: true,
		},
	},
	ignorePatterns: ['.eslintrc.js'],
	rules: {
		"@typescript-eslint/no-explicit-any": 0,
		"@typescript-eslint/ban-ts-comment": 0
	},
};
