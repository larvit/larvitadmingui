'use strict';

const test = require('tape');

test('eslint', require('tape-eslint')({
	ignore: ['public/vendor/**']
}));
