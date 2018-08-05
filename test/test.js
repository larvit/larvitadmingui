'use strict';

const	freeport	= require('freeport'),
	request	= require('requestretry'),
	cheerio	= require('cheerio'),
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

	let	port,
		app;

	// Get free port
	tasks.push(function (cb) {
		freeport(function (err, result) {
			port	= result;
			cb(err);
		});
	});

	// Start gui http server
	tasks.push(function (cb) {
		app	= require(__dirname + '/../server.js')({
			'port':	port
		});
		cb();
	});

	// Check if the GUI is up
	tasks.push(function (cb) {
		request('http://127.0.0.1:' + port, function (err, response, body) {
			let	$;

			if (err) return cb(err);

			$	= cheerio.load(body);

			t.equal(response.statusCode,	200);
			t.equal($('#login_form').length,	1);

			cb();
		});
	});

	// Shut down the http server
	tasks.push(function (cb) {
		app.server.close(cb);
	});

	// Shut down the database pool
	tasks.push(function (cb) {
		db.pool.end(cb);
	});

	async.series(tasks, function (err) {
		if (err) throw err;
		t.end();
	});
});