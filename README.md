# larvitadmingui
node.js admin GUI

## Installation

```bash
npm i larvitadmingui
```

or for latest HEAD:

```bash
cd apppath
git clone https://github.com/larvit/larvitadmingui.git node_modules/larvitadmingui
cd node_modules/larvitadmingui
npm i
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