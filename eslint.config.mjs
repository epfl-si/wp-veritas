import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const rules = [
	...compat.extends('next/core-web-vitals', 'next/typescript'),
	{
		files: ['**/*.{js,ts,jsx,tsx}'],
		rules: {
			indent: [
				'error',
				'tab',
				{
					SwitchCase: 1,
					VariableDeclarator: { var: 1, let: 1, const: 1 },
					outerIIFEBody: 1,
					FunctionDeclaration: { parameters: 1, body: 1 },
					FunctionExpression: { parameters: 1, body: 1 },
					CallExpression: { arguments: 1 },
					ArrayExpression: 1,
					ObjectExpression: 1,
					ImportDeclaration: 1,
					flatTernaryExpressions: false,
					ignoredNodes: ['TemplateLiteral *'],
					ignoreComments: false,
				},
			],
			'no-mixed-spaces-and-tabs': 'error',
			'no-tabs': 'off',
			semi: ['error', 'always'],
			quotes: ['error', 'double', { avoidEscape: true }],
			'comma-dangle': ['error', 'always-multiline'],
			'key-spacing': ['error', { beforeColon: false, afterColon: true }],
			'object-curly-spacing': ['error', 'always'],
			'array-bracket-spacing': ['error', 'never'],
			'space-in-parens': ['error', 'never'],
			'space-before-blocks': ['error', 'always'],
			'space-infix-ops': 'error',
			'no-console': ['error', {
				allow: ['warn', 'error']
			}],
			eqeqeq: ['error', 'always'],
			curly: ['error', 'multi-line'],
		},
	},
];

export default rules;
