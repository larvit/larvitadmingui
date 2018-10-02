'use strict';

const	UserLib	= require('larvituser'),
	LUtils	= require('larvitutils'),
	lUtils	= new LUtils(),
	async	= require('async'),
	log	= new lUtils.Log('warn'),
	App	= require(__dirname + '/index.js'),
	db	= require('larvitdb'),
	tasks	= [];

let userLib;

// Setup database
tasks.push(function (cb) {
	const	dbConf	= require(__dirname + '/config/db_test.json');

	dbConf.log	= log;
	db.setup(dbConf);
	cb();
});

// Start userLib
tasks.push(function (cb) {
	userLib	= new UserLib({'log': log, 'db': db});
	cb();
});

// Create admin user
tasks.push(function (cb) {
	userLib.fromUsername('flump', function (err, user) {
		if (err) throw err;
		if (user) return cb();
		userLib.create('flump', 'blärk', {'role': 'admin'}, cb);
	});

});

async.series(tasks, function (err) {
	if (err) throw err;
    
	const app	= new App({
		'port':	8000,
		'userLib':	userLib,
		'log':	log,
		'db':	db
	});
	app.start(function (err) {
		if (err) throw err;
		console.log('up and running ');
	});
}); 