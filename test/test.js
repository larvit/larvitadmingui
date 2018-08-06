'use strict';

const	Intercom	= require('larvitamintercom'),
	freeport	= require('freeport'),
	request	= require('requestretry'),
	userLib	= require('larvituser'),
	cheerio	= require('cheerio'),
	async	= require('async'),
	test	= require('tape'),
	//App	= require(__dirname + '/../index.js'),
	db	= require('larvitdb');

let	port,
	app;

userLib.dataWriter.mode	= 'master';
userLib.dataWriter.intercom	= new Intercom('loopback interface');

if ( ! process.env.DBCONFFILE) {
	process.env.DBCONFFILE	= 'config/db_test.json';
}

function startStuff(cb) {
	const	tasks	= [];

	db.setup(require(__dirname + '/../' + process.env.DBCONFFILE));

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

	// Create admin user
	tasks.push(function (cb) {
		userLib.create('flump', 'blärk', {'role': 'admin'}, cb);
	});

	async.series(tasks, cb);
}

function stopStuff(cb) {
	const	tasks	= [];

	// Shut down the http server
	tasks.push(function (cb) {
		app.server.close(cb);
	});

	// Clean out the database
	tasks.push(function (cb) {
		db.removeAllTables(cb);
	});

	// Shut down the database pool
	tasks.push(function (cb) {
		db.pool.end(cb);
	});

	async.series(tasks, cb);
}

test('startup', function (t) {
	startStuff(function (err) {
		if (err) throw err;
		t.end();
	});
});

// Check if the GUI is up
//test('Basic request', function (t) {
//	request('http://127.0.0.1:' + port, function (err, response, body) {
//		let	$;
//
//		if (err) throw err;
//
//		$	= cheerio.load(body);
//
//		t.equal(response.statusCode,	200);
//		t.equal($('#login_form').length,	1);
//
//		t.end();
//	});
//});

test('Login', function (t) {
	const	reqOptions	= {},
		jar	= request.jar();

	reqOptions.url	= 'http://127.0.0.1:' + port;
	reqOptions.jar	= jar;
	reqOptions.method	= 'post';
	reqOptions.form	= {};
	reqOptions.form.username	= 'flump';
	reqOptions.form.password	= 'blärk';

	request(reqOptions, function (err, response, body) {
		let	$;

		if (err) throw err;

		$	= cheerio.load(body);

		t.equal(response.statusCode,	200);
		t.equal($('a[href="/logout"]').length,	1);

		// Check so its still up
		request({'url': reqOptions.url, 'jar': jar}, function (err, response, body) {
			let	$;

			if (err) throw err;

			$	= cheerio.load(body);

			t.equal(response.statusCode,	200);
			t.equal($('a[href="/logout"]').length,	1);

			t.end();
		});
	});
});

test('shutdown', function (t) {
	stopStuff(function (err) {
		if (err) throw err;
		t.end();
	});
});