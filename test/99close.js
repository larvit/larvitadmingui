'use strict';

const	UserApi	= require('larvituser-api'),
	test	= require('tape'),
	db	= require('larvitdb');

test('Close API and clean db', function (t) {
	UserApi.instance.stop(function (err) {
		if (err) throw err;

		db.removeAllTables(function (err) {
			if (err) throw err;
			t.end();
			process.exit(0);
		});
	});
});
