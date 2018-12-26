var async = require('async'),
	services = require('./'),
	soap = require('soap'),
	webservice = {
		vehicle: null,
		part: null,
		category: null,
		order: null
	},
	models = require('../models'),
	_ = require('underscore');

var advanceAuto = {
	init: function() {
		async.series([
			function(callback) {
				soap.createClient(process.env.AA_VEHICLE_WSDL, {strictSSL: false}, function(err, client) {
					if (err) return callback(err);

					webservice.vehicle = client;

					callback();
				});
			},
			function(callback) {
				soap.createClient(process.env.AA_CATEGORY_WSDL, function(err, client) {
					if (err) return callback(err);

					webservice.category = client;

					callback();
				});
			},
			function(callback) {
				soap.createClient(process.env.AA_PART_WSDL, function (err, client) {
					if (err) return callback(err);

					webservice.part = client;

					callback();
				});
			},
			function(callback) {
				soap.createClient(process.env.AA_ORDER_WSDL, function (err, client) {
					if (err) return callback(err);

					webservice.order = client;

					callback();
				});
			}
		], function(err) {
			if (err) {
				console.log(err);
				services.notify.someoneAboutError(err);
			}
		});
	},
	findPartsByVIN: function(vin, part, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);
		var self = this;

		webservice.vehicle.setSecurity(wsSecurity);
		webservice.category.setSecurity(wsSecurity);
		webservice.part.setSecurity(wsSecurity);

		async.waterfall([
			function(callback) {
				webservice.vehicle.findVehiclesByVIN({vin: vin.toUpperCase()}, function(err, result) {
					if (err) return callback(err);
					if (!result) return callback(null, {});

					callback(err, result.return.length ? result.return[0] : {});
				});
			},
			function(vehicle, callback) {
				webservice.category.searchItemTypes({
					description: part,
					type: 'A'
				}, function(err, result) {
					if (err) return callback(err);
					if (!result) return callback(null, vehicle, []);

					for (var i = 0; i < result.return.length; i++) {
						delete result.return[i].description;
						delete result.return[i].position;
					}

					callback(null, vehicle, result.return);
				});
			},
			function(vehicle, items, callback) {
				webservice.part.findItemsByItemType({
					orderType: 'regular',
					store: user.advanceAuto.store,
					vehicle: vehicle.vehicle,
					item: items
				}, function(err, result) {
					if (err) return callback(err);
					if (!result) return callback(null, []);
					if (!result.return) return callback(null, []);
					if (!result.return.part) return callback(null, []);

					var regex = new RegExp(part, 'ig');
					var aapParts = result.return.part.constructor === Array ? result.return.part : [result.return.part];
					var	relevantParts = _.filter(aapParts, function(cmpPart) {
						// Check the parts descriptions and the item type description for a match to the search text
						var partMatch = _.filter(cmpPart.part, function(part) { return regex.test(part.description); })

						return regex.test(cmpPart.itemType.description) || partMatch.length;
					});
					var grouped = _.groupBy(relevantParts, function(part) { return part.itemType.description; });
					var parts = [];

					for (var key in grouped) {
						if (grouped.hasOwnProperty(key)) {
							var items = grouped[key];

							for (var i = 1; i < items.length; i++) {
								items[0].part.push.apply(items[0].part, items[i].part);
							}

							parts.push(items[0]);
						}
					}

					if (!parts.length) parts = aapParts;

					for (var i = 0; i < parts.length; i++) {
						parts[i].aces = vehicle;

						for (var j = 0; j < parts[i].part.length; j++) {
							var id = parts[i].part[j].id.number.replace('/', 'fs');

							parts[i].part[j].img = process.env.API_URI + '/images/' + parts[i].part[j].id.line + '/' + id + '.png';
						}
					}

					callback(null, parts);
				});
			}
		], callback);
	},
	findPartsByACES: function(vehicle, part, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);
		var self = this;

		webservice.category.setSecurity(wsSecurity);
		webservice.part.setSecurity(wsSecurity);
		webservice.vehicle.setSecurity(wsSecurity);

		async.waterfall([
			function(callback) {
				webservice.category.searchItemTypes({
					description: part,
					type: 'A'
				}, function(err, result) {
					if (err) return callback(err);
					if (!result) return callback(null, vehicle, []);

					for (var i = 0; i < result.return.length; i++) {
						delete result.return[i].description;
						delete result.return[i].position;
					}

					callback(null, result.return);
				});
			},
			function(items, callback) {
				if (vehicle.engineBase) return callback(null, items, vehicle);

				webservice.vehicle.findVehicle({
					vehicle: {
						year: vehicle.year,
						make: vehicle.make,
						model: vehicle.model,
						submodel: vehicle.submodel
					},
					attribute: 'engineBase'
				}, function(err, result) {
					if (err) return callback(err);
					if (!result) return callback('No Results');
					if (!result.return.compound.length) return callback('No Results');

					vehicle.engineBase = result.return.compound[0].id;
					callback(null, items, vehicle);
				});
			},
			function(items, vehicle, callback) {
				webservice.vehicle.findVehicleSpecifications({
					vehicle: vehicle
				}, function(err, result) {
					if (err) return callback(err);
					if (!result.vehicle) return callback('No Results');

					callback(null, items, result.vehicle);
				});
			},
			function(items, vehicle, callback) {
				webservice.part.findItemsByItemType({
					orderType: 'regular',
					store: user.advanceAuto.store,
					vehicle: vehicle,
					item: items
				}, function(err, result) {
					if (err) return callback(err);
					if (!result) return callback(null, []);
					if (!result.return) return callback(null, []);
					if (!result.return.part) return callback(null, []);

					var regex = new RegExp(part, 'ig');
					var aapParts = result.return.part.constructor === Array ? result.return.part : [result.return.part];
					var relevantParts = _.filter(aapParts, function(cmpPart) {
						// Check the parts descriptions and the item type description for a match to the search text
						var partMatch = _.filter(cmpPart.part, function(part) { return regex.test(part.description); })

						return regex.test(cmpPart.itemType.description) || partMatch.length;
					});
					var grouped = _.groupBy(relevantParts, function(part) { return part.itemType.description; });
					var parts = [];

					for (var key in grouped) {
						if (grouped.hasOwnProperty(key)) {
							var items = grouped[key];

							for (var i = 1; i < items.length; i++) {
								items[0].part.push.apply(items[0].part, items[i].part);
							}

							parts.push(items[0]);
						}
					}

					if (!parts.length) parts = aapParts;

					for (var i = 0; i < parts.length; i++) {
						parts[i].aces = vehicle;

						for (var j = 0; j < parts[i].part.length; j++) {
							var id = parts[i].part[j].id.number.replace('/', 'fs');

							parts[i].part[j].img = process.env.API_URI + '/images/' + parts[i].part[j].id.line + '/' + id + '.png';
						}
					}

					callback(null, parts);
				});
			}
		], callback);
	},
	findPartsByPartNumber: function(part, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.part.setSecurity(wsSecurity);

		webservice.part.searchPartNumbers({
			orderType: 'regular',
			store: user.advanceAuto.store,
			partNumber: part,
			interchange: false
		}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, []);

			var parts = result.return.constructor === Array ? result.return : [result.return];

			for (var i = 0; i < parts.length; i++) {
				var id = parts[i].id.number.replace('/', 'fs');

				parts[i].img = process.env.API_URI + '/images/' + parts[i].id.line + '/' + id + '.png';
			}

			callback(null, parts);
		});
	},
	verify: function(opts, callback) {
		var wsSecurity = new soap.WSSecurity(opts.id, opts.password);

		webservice.part.setSecurity(wsSecurity);
		webservice.part.searchPartNumbers({
			//store: opts.store,
			orderType: 'regular',
			partNumber: 'PXD1508H',
			interchange: false
		}, function(err, result) {
			callback(err, result.return ? true: false);
		});
	},
	checkout: function(checkout, parts, user, callback) {
		async.waterfall([
			function(callback) {
				var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password),
					orders = [];

				for (var i = 0; i < parts.length; i++) {
					orders.push({
						customVehicle: 'custom',
						id: parts[i].part.aaId || parts[i].part.id,
						quantity: parts[i].checkout.qty
					});
				}

				webservice.order.setSecurity(wsSecurity);
				webservice.order.order({
					systemId: 'urn:uuid:' + process.env.AA_UUID,
					orderType: 'regular',
					store: user.advanceAuto.store,
					po: checkout.po,
					order: orders
				}, function(err, result) {
					callback(err, result);
				});
			},
			function(order, callback) {
				var ordersToRecord = [],
					vehicle,
					vin;

				if (parts[0].vehicle) {
					vehicle = parts[0].vehicle.years ? parts[0].vehicle.years[0].year + ' ' + parts[0].vehicle.make.name + ' ' + parts[0].vehicle.model.name + ' ' + (parts[0].vehicle.engine ? parts[0].vehicle.engine.size + ' ' + parts[0].vehicle.engine.cylinder + ' cyl' : '') : '';
					vin = parts[0].vehicle.vin || '';
				}

				for (var i = 0; i < order.orderedQuantity.length; i++) {
					ordersToRecord.push({
						lineCode: order.orderedQuantity[i].id.line,
						partNumber: order.orderedQuantity[i].id.number,
						cost: order.orderedQuantity[i].buyPrice.amount,
						qty: order.orderedQuantity[i].quantityOrdered
					});
				}

				services.order.record({
					vehicle: vehicle,
					vin: vin
				}, user, null, null, ordersToRecord, function(err) {
					if (err) console.log(err);

					callback(null, order);
				});
			}
		], callback);
	},
	getYears: function(user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.vehicle.setSecurity(wsSecurity);

		webservice.vehicle.findVehicle({
			vehicle: {},
			attribute: 'year'
		}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, []);

			callback(null, result.return ? result.return.simple : []);
		});
	},
	getMakes: function(year, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.vehicle.setSecurity(wsSecurity);

		webservice.vehicle.findVehicle({
			vehicle: {
				year: year
			},
			attribute: 'make'
		}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, []);

			callback(null, result.return ? result.return.simple : []);
		});
	},
	getModels: function(year, make, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.vehicle.setSecurity(wsSecurity);

		webservice.vehicle.findVehicle({
			vehicle: {
				year: year,
				make: make
			},
			attribute: 'model'
		}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, []);

			callback(null, result.return ? result.return.simple : []);
		});
	},
	getSubModels: function(year, make, model, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.vehicle.setSecurity(wsSecurity);

		webservice.vehicle.findVehicle({
			vehicle: {
				year: year,
				make: make,
				model: model
			},
			attribute: 'submodel'
		}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, []);

			callback(null, result.return ? result.return.simple : []);
		});
	},
	getEngineBase: function(year, make, model, subModel, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.vehicle.setSecurity(wsSecurity);

		webservice.vehicle.findVehicle({
			vehicle: {
				year: year,
				make: make,
				model: model,
				submodel: subModel
			},
			attribute: 'engineBase'
		}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, []);

			callback(null, result.return ? result.return.compound : []);
		});
	},
	storePartForScraping: function(mfg, part) {
		models.aapPart.update({
			mfg: mfg,
			number: part
		}, {
			mfg: mfg,
			number: part,
			url: '',
			attempts: []
		}, {upsert: true}, function(err, updated) {
				if (err) services.notify.someoneAboutError(err, function() {});
		});
	},
	getVehicleDataByVIN: function(vin, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.vehicle.setSecurity(wsSecurity);
		webservice.vehicle.findVehiclesByVIN({vin: vin.toUpperCase()}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, {});

			callback(err, result.return.length ? result.return[0].vehicle : {});
		});
	},
	getVehicleDataByVehicleObj: function(vehicle, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.vehicle.setSecurity(wsSecurity);
		webservice.vehicle.findVehicleSpecifications({
			vehicle: this._formatVehicleObj(vehicle)
		}, function(err, result) {
			if (err) return callback(err);
			if (!result.vehicle) return callback('No Results');

			callback(null, result.vehicle);
		});
	},
	getItemTypes: function(part, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);

		webservice.category.setSecurity(wsSecurity);
		webservice.category.searchItemTypes({
			description: part,
			type: 'A'
		}, function(err, result) {
			if (err) return callback(err);

			callback(null, result ? result.return : []);
		});
	},
	getParts: function(vehicle, itemType, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);
		var orderedVehicle = this._formatVehicleObj(vehicle);

		delete itemType.description;
		delete itemType.position;

		webservice.part.setSecurity(wsSecurity);
		webservice.part.findItemsByItemType({
			orderType: 'regular',
			store: user.advanceAuto.store,
			vehicle: orderedVehicle,
			item: itemType
		}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, []);
			if (!result.return) return callback(null, []);
			if (!result.return.part) return callback(null, []);

			var items = result.return.part.constructor === Array ? result.return.part : [result.return.part];
			var itemsToReturn = [];

			for (var i = 0; i < items.length; i++) {
				var parts = [];

				for (var j = 0; j < items[i].part.length; j++) {
					var part = items[i].part[j];
					var id = part.id.number.replace('/', 'fs');
					var inStock = _.find(part.information.location, function(location) { return parseInt(location.quantity) != 0; });

					part.img = process.env.API_URI + '/images/' + part.id.line + '/' + id + '.png';

					if (inStock) parts.push(part);
				}

				if (parts.length) {
					itemsToReturn.push({
						aces: vehicle,
						itemType: items[i].itemType,
						part: parts
					});
				}
			}

			callback(null, itemsToReturn);
		});
	},
	getVehicleOptions: function(vehicle, attribute, user, callback) {
		var wsSecurity = new soap.WSSecurity(user.advanceAuto.id, user.advanceAuto.password);
		var orderedVehicle = this._formatVehicleObj(vehicle);

		webservice.vehicle.setSecurity(wsSecurity);
		webservice.vehicle.findVehicle({
			vehicle: orderedVehicle,
			attribute: attribute
		}, function(err, result) {
			if (err) return callback(err);
			if (!result) return callback(null, []);

			callback(null, result.return ? result.return.simple : []);
		});
	},
	_formatVehicleObj: function(vehicle) {
		var orderedVehicle = {};

		if (vehicle.year) orderedVehicle['year'] = vehicle.year;
		if (vehicle.make) orderedVehicle['make'] = vehicle.make;
		if (vehicle.model) orderedVehicle['model'] = vehicle.model;
		if (vehicle.submodel) orderedVehicle['submodel'] = vehicle.submodel;
		if (vehicle.region) orderedVehicle['region'] = vehicle.region;
		if (vehicle.bedConfig) orderedVehicle['bedConfig'] = vehicle.bedConfig;
		if (vehicle.bedLength) orderedVehicle['bedLength'] = vehicle.bedLength;
		if (vehicle.bedType) orderedVehicle['bedType'] = vehicle.bedType;
		if (vehicle.bodyStyleConfig) orderedVehicle['bodyStyleConfig'] = vehicle.bodyStyleConfig;
		if (vehicle.bodyNumDoors) orderedVehicle['bodyNumDoors'] = vehicle.bodyNumDoors;
		if (vehicle.bodyType) orderedVehicle['bodyType'] = vehicle.bodyType;
		if (vehicle.driveType) orderedVehicle['driveType'] = vehicle.driveType;
		if (vehicle.mfrBodyCode) orderedVehicle['mfrBodyCode'] = vehicle.mfrBodyCode;
		if (vehicle.wheelBase) orderedVehicle['wheelBase'] = vehicle.wheelBase;
		if (vehicle.brakeConfig) orderedVehicle['brakeConfig'] = vehicle.brakeConfig;
		if (vehicle.frontBrakeType) orderedVehicle['frontBrakeType'] = vehicle.frontBrakeType;
		if (vehicle.rearBrakeType) orderedVehicle['rearBrakeType'] = vehicle.rearBrakeType;
		if (vehicle.brakeSystem) orderedVehicle['brakeSystem'] = vehicle.brakeSystem;
		if (vehicle.brakeABS) orderedVehicle['brakeABS'] = vehicle.brakeABS;
		if (vehicle.springTypeConfig) orderedVehicle['springTypeConfig'] = vehicle.springTypeConfig;
		if (vehicle.frontSpringType) orderedVehicle['frontSpringType'] = vehicle.frontSpringType;
		if (vehicle.rearSpringType) orderedVehicle['rearSpringType'] = vehicle.rearSpringType;
		if (vehicle.steeringConfig) orderedVehicle['steeringConfig'] = vehicle.steeringConfig;
		if (vehicle.steeringType) orderedVehicle['steeringType'] = vehicle.steeringType;
		if (vehicle.steeringSystem) orderedVehicle['steeringSystem'] = vehicle.steeringSystem;
		if (vehicle.engineConfig) orderedVehicle['engineConfig'] = vehicle.engineConfig;
		if (vehicle.engineDesignation) orderedVehicle['engineDesignation'] = vehicle.engineDesignation;
		if (vehicle.engineVIN) orderedVehicle['engineVIN'] = vehicle.engineVIN;
		if (vehicle.valves) orderedVehicle['valves'] = vehicle.valves;
		if (vehicle.engineBase) orderedVehicle['engineBase'] = vehicle.engineBase;
		if (vehicle.fuelDeliveryType) orderedVehicle['fuelDeliveryType'] = vehicle.fuelDeliveryType;
		if (vehicle.fuelDeliverySubType) orderedVehicle['fuelDeliverySubType'] = vehicle.fuelDeliverySubType;
		if (vehicle.fuelSystemControlType) orderedVehicle['fuelSystemControlType'] = vehicle.fuelSystemControlType;
		if (vehicle.fuelSystemDesign) orderedVehicle['fuelSystemDesign'] = vehicle.fuelSystemDesign;
		if (vehicle.aspiration) orderedVehicle['aspiration'] = vehicle.aspiration;
		if (vehicle.cylinderHeadType) orderedVehicle['cylinderHeadType'] = vehicle.cylinderHeadType;
		if (vehicle.fuelType) orderedVehicle['fuelType'] = vehicle.fuelType;
		if (vehicle.ignitionSystemType) orderedVehicle['ignitionSystemType'] = vehicle.ignitionSystemType;
		if (vehicle.engineMfr) orderedVehicle['engineMfr'] = vehicle.engineMfr;
		if (vehicle.engineVersion) orderedVehicle['engineVersion'] = vehicle.engineVersion;
		if (vehicle.transmission) orderedVehicle['transmission'] = vehicle.transmission;
		if (vehicle.transmissionType) orderedVehicle['transmissionType'] = vehicle.transmissionType;
		if (vehicle.transmissionNumSpeeds) orderedVehicle['transmissionNumSpeeds'] = vehicle.transmissionNumSpeeds;
		if (vehicle.transmissionControlType) orderedVehicle['transmissionControlType'] = vehicle.transmissionControlType;
		if (vehicle.transmissionMfrCode) orderedVehicle['transmissionMfrCode'] = vehicle.transmissionMfrCode;
		if (vehicle.transmissionMfr) orderedVehicle['transmissionMfr'] = vehicle.transmissionMfr;
		if (vehicle.transmissionElecControlled) orderedVehicle['transmissionElecControlled'] = vehicle.transmissionElecControlled;

		return orderedVehicle;
	}
};

module.exports = advanceAuto;