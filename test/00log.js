'use strict';

const	log	= require('winston');

// Set up winston
log.remove(log.transports.Console);
/**/log.add(log.transports.Console, {
	'level':	'info',
	'colorize':	true,
	'timestamp':	true,
	'json':	false
});/**/
