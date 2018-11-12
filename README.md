# larvitadmingui

node.js admin GUI

## Installation

```bash
npm i larvitadmingui;
```

## Usage

### Application startup

In your app, start the admin interface like this:

```javascript
'use strict';

const	Intercom	= require('larvitamintercom'),
	UserLib	= require('larvituser'),
	winston	= require('winston'),
	log	= winston.createLogger({'transports': [new winston.transports.Console()]}),
	App	= require('larvitadmingui'),
	db	= require('larvitdb');

let	userLib,
	app;

db.setup(...); // See https://github.com/larvit/larvitdb on how to configure the database

userLib = new UserLib({
	'db':	db,
	'log':	log,
	'mode':	'master',
	'intercom':	new Intercom({'conStr': 'loopback interface', 'log': log})
});

app = new App({
	'port':	8001, // Listening port
	'userLib':	userLib,
	'log':	log,
	'db':	db
});
```

Start it up and check your browser at http://127.0.0.1:8001 - be sure to setup your MySQL or MariaDB correctly with your database settings in this file.

### Set messages or errors in the GUI from a controller

```javascript
'use strict';

exports.run = function(req, res, cb) {
	res.data	= {'global': res.globalData};

	res.data.global.messages	= ['Happy message'];
	res.data.global.errors	= ['Sad message'];

	cb(null, req, res);
};
```

To set messages to the next page load, do this:

```javascript
if ( ! req.session.data.nextCallData)
	req.session.data.nextCallData = {};

req.session.data.nextCallData	= {'global': {'messages': ['Happy message']}};
// or
req.session.data.nextCallData	= {'global': {'errors': ['Sad message']}};
```

These will be loaded on the next page load, and then erased again.
