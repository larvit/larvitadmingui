'use strict';

const	UserApi	= require('larvituser-api'),
	freeport	= require('freeport'),
	cheerio	= require('cheerio'),
	request	= require('request'),
	test	= require('tape');

let	port;

test('start server', function (t) {
	freeport(function(err, result) {
		if (err) throw err;

		port	= result;

		require(__dirname + '/../server.js')({
			'host':	'127.0.0.1',
			'port':	port,
			'userApiUrl':	'http://127.0.0.1:' + UserApi.instance.api.lBase.httpServer.address().port
		});

		request('http://127.0.0.1:' + port, function (err, response, body) {
			let	$;

			if (err) throw err;

			$	= cheerio.load(body);

			t.equal($('h1').text(),	'Larv IT Admin GUI - Login');

			t.end();
			process.exit();
		});
	});
});
