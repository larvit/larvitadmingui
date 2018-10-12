'use strict';

const	test	= require('tape');

test('eslint', require('tape-eslint')({
	'files': [
		'index.js',
		'controllers/*',
		'models/*',
		'dbMigration/*',
		'test/*'
	]
}));
