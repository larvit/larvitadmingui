'use strict';

exports = module.exports = function(customOptions) {
	var returnObj;

	if (customOptions === undefined) {
		customOptions = {};
	}

	if (customOptions.customRoutes === undefined) {
		customOptions.customRoutes = [];
	}

	customOptions.customRoutes.push({
		'regex': '^/$',
		'controllerName': 'login'
	});

	returnObj = require('larvitbase')(customOptions);

	// Overload the execute controller to support the ACL
	returnObj.parentExecuteController = returnObj.executeController;

	returnObj.executeController = function(request, response, sendToClient) {
		console.log('ACL should be here!');
		returnObj.parentExecuteController(request, response, sendToClient);
	};

	return returnObj;
};
