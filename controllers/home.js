'use strict';

function run(req, res, cb) {
	res.data = {global: res.globalData};
	res.data.global.menuControllerName = 'home';
	cb(null, req, res);
};

module.exports = run;
module.exports.run = run;
