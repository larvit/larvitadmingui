'use strict';

const	freeport	= require('freeport'),
	//request	= require('requestretry'),
	async	= require('async'),
	test	= require('tape'),
	//App	= require(__dirname + '/../index.js'),
	db	= require('larvitdb');

if ( ! process.env.DBCONFFILE) {
	process.env.DBCONFFILE	= 'config/db_test.json';
}

db.setup(require(__dirname + '/../' + process.env.DBCONFFILE));

test('Basic request', function (t) {
	const	tasks	= [];

	let	port;

	// Get free port
	tasks.push(function (cb) {
		freeport(function (err, result) {
			port	= result;
			console.log(port);
			cb(err);
		});
	});

	tasks.push(function (cb) {
		db.pool.end(function (err) {
			console.log('höhö');
			cb(err);
		});
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});