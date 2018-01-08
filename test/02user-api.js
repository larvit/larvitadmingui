'use strict';

const	UserApi	= require('larvituser-api'),
	test	= require('tape'),
	log	= require('winston'),
	db	= require('larvitdb');

if (process.env.DBCONFFILE === undefined) {
	db.setup(require(__dirname + '/../config/db_test.json'));
} else {
	db.setup(require(__dirname + '/../' + process.env.DBCONFFILE));
}

UserApi.instance	= new UserApi({'db':	db});

test('starting the user API', function (t) {
	UserApi.instance.start(function (err) {
		if (err) throw err;
		log.info('larvituser-API up and running');
		t.end();
	});
});
