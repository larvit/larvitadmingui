'use strict';

const freeport = require('freeport');
const request = require('requestretry');
const UserLib = require('larvituser');
const cheerio = require('cheerio');
const LUtils = require('larvitutils');
const lUtils = new LUtils();
const async = require('async');
const test = require('tape');
const log = new lUtils.Log('warn');
const App = require(__dirname + '/../index.js');
const db = require('larvitdb');

let userLib;
let port;
let app;

if (!process.env.DBCONFFILE) {
	process.env.DBCONFFILE = 'config/db_test.json';
}

function startStuff(cb) {
	const tasks = [];

	// Setup database
	tasks.push(function (cb) {
		const dbConf = require(__dirname + '/../' + process.env.DBCONFFILE);

		dbConf.log = log;
		db.setup(dbConf);
		cb();
	});

	// Start userLib
	tasks.push(function (cb) {
		userLib = new UserLib({log: log, db: db});
		cb();
	});

	// Get free port
	tasks.push(function (cb) {
		freeport(function (err, result) {
			port = result;
			cb(err);
		});
	});

	// Start gui http server
	tasks.push(function (cb) {
		app = new App({
			port: port,
			userLib: userLib,
			log: log,
			db: db
		});
		app.start(cb);
	});

	// Create admin user
	tasks.push(function (cb) {
		userLib.create('flump', 'blärk', {role: 'admin'}, cb);
	});

	async.series(tasks, cb);
}

function stopStuff(cb) {
	const tasks = [];

	// Shut down the http server
	tasks.push(function (cb) {
		app.stop(cb);
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
test('Basic request', function (t) {
	request('http://127.0.0.1:' + port, function (err, response, body) {
		let $;

		if (err) throw err;

		$ = cheerio.load(body);

		t.equal(response.statusCode, 200);
		t.equal($('#login_form').length, 1);

		t.end();
	});
});

test('Login', function (t) {
	const reqOptions = {};
	const jar = request.jar();

	reqOptions.url = 'http://127.0.0.1:' + port;
	reqOptions.jar = jar;
	reqOptions.method = 'post';
	reqOptions.form = {};
	reqOptions.form.username = 'flump';
	reqOptions.form.password = 'blärk';

	request(reqOptions, function (err, response, body) {
		let $;

		if (err) throw err;

		$ = cheerio.load(body);

		t.equal(response.statusCode, 200);
		t.equal($('a[href="/logout"]').length, 1);

		// Check so its still up
		request({url: reqOptions.url, jar: jar}, function (err, response, body) {
			let $;

			if (err) throw err;

			$ = cheerio.load(body);

			t.equal(response.statusCode, 200);
			t.equal($('a[href="/logout"]').length, 1);

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
