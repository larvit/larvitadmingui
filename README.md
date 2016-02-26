# larvitadmingui
node.js admin GUI

## Installation

```bash
npm i larvitadmingui;
cd public;
../node_modules/.bin/bower i;
cd ..;
```

or for latest HEAD:

```bash
cd apppath
git clone https://github.com/larvit/larvitadmingui.git node_modules/larvitadmingui
cd node_modules/larvitadmingui
npm i
cd public;
../node_modules/.bin/bower i;
cd ..;
```

## Usage


### Application startup

In your app, start the admin interface like this:


```javascript
'use strict';

var dbConf = {'host': '127.0.0.1', 'user': 'root', 'pass': 'foobar', 'database': 'test'};

// Setup database pool
db.setup(dbConf, function(err) {
	if (err) {
		throw err;
	}

	require('larvitadmingui')({
		'host': '127.0.0.1',
		'port': 8001
	});
});
```

Start it up and check your browser at http://127.0.0.1:8001 - be sure to setup your MySQL or MariaDB correctly with your database settings in this file.

### Set messages or errors in the GUI from a controller

```javascript
'use strict';

exports.run = function(req, res, cb) {
	var data = {'global': res.globalData};

	data.global.messages = ['Happy message'];
	data.global.errors   = ['Sad message'];

	cb(null, req, res, data);
};
```

To set messages to the next page load, do this:

```javascript
if ( ! req.session.data.nextCallData)
	req.session.data.nextCallData = {};

req.session.data.nextCallData = {'global': {'messages': ['Happy message']}};
// or
req.session.data.nextCallData = {'global': {'errors': ['Sad message']}};
```

These will be loaded on the next page load, and then erased again.
