var models = require('../models'),
	services = require('./'),
	moment = require('moment'),
	async = require('async');

var order = {
	record: function(vehicleData, user, autozone, partsAuthority, advanceAuto, callback) {
		var	autozone = autozone || [],
			partsAuthority = partsAuthority || [],
			advanceAuto = advanceAuto || [],
			order = new models.order({
				date: new Date(),
				name: user.name,
				email: user.email,
				total: 0,
				vin: vehicleData.vin,
				vehicle: vehicleData.vehicle,
				autoZone: autozone,
				partsAuthority: partsAuthority,
				advanceAuto: advanceAuto
			});

		for (var i = 0; i < autozone.length; i++) {
			order.total += autozone[i].qty * (autozone[i].shopCost + autozone[i].adjAmount);
		}

		for (var i = 0; i < partsAuthority.length; i++) {
			order.total += partsAuthority[i].qty * partsAuthority[i].cost;
		}

		for (var i = 0; i < advanceAuto.length; i++) {
			order.total += advanceAuto[i].qty * advanceAuto[i].cost;
		}

		order.save(callback);
	}
};

module.exports = order;