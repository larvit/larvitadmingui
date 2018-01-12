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

require('larvitadmingui')({
	'port':	8001,
	'userApiUrl':	'http://somewhere.com'
});
```

The GUI require a user API compatible with [larvituser-api](https://github.com/larvit/larvituser-api). Just follow the instructions in that package to set one up.

Start it up and check your browser at http://127.0.0.1:8001

### Set messages or errors in the GUI from a controller

```javascript
'use strict';

exports.run = function(req, res, cb) {
	const	data	= {'global': res.globalData};

	data.global.messages	= ['Happy message'];
	data.global.errors	= ['Sad message'];

	cb(null, req, res, data);
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
