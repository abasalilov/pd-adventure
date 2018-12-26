var models = require('../models'),
	services = require('./'),
	Client = require('node-rest-client').Client
	async = require('async');

var partsAuthority = {
	locations: [
		{
			name: 'azstock',
			dailyName: 'azqty',
			location: {
				latitude: 33.454423,
				longitude: -112.107278
			}
		},
		{
			name: 'bxstock',
			dailyName: 'bxqty',
			location: {
				latitude: 40.843436,
				longitude: -73.857085
			}
		},
		{
			name: 'bystock',
			dailyName: 'byqty',
			location: {
				latitude: 40.761589,
				longitude: -73.796018
			}
		},
		{
			name: 'dcstock',
			dailyName: 'dcqty',
			location: {
				latitude:38.967273,
				longitude: -77.011071
			}
		},
		{
			name: 'nystock',
			dailyName: 'rvcqty',
			location: {
				latitude: 40.655390,
				longitude: -73.635507
			}
		},
		{
			name: 'gastock',
			dailyName: 'gaqty',
			location: {
				latitude:33.950488,
				longitude: -84.224244
			}
		}
	],
	checkIfClose: function(geometry) {
		var closeLocation = {};

		for (var key in this.locations) {
			if (this.locations.hasOwnProperty(key)) {
				var location = this.locations[key],
					miles = services.distance.getInMiles(geometry, {
						latitude: location.location.latitude,
						longitude: location.location.longitude
					});

				if (miles < 100) {
					closeLocation = location;
					break;
				}
			}
		}

		return closeLocation;
	},
	checkStock: function(opts, user, callback) {
		var client = new Client(),
			reqData = {
				'userName': user.partsAuthority.user,
				'userPass': user.partsAuthority.password,
				'accountNum': user.partsAuthority.acctNumber,
				'client': 'Parts Detect',
				'line_code': opts.lineCode,
				'part_number': opts.manufacturer_number,
				'action': "checkStock"
			};

		client.get(process.env.PA_ENDPOINT + JSON.stringify(reqData), function (paData, response) {
			if (paData.indexOf('Error!') != -1) return callback(new Error(paData));
			paData = JSON.parse(paData);
			paData.responseDetail.price = (parseFloat(paData.responseDetail.price) * 1.15).toFixed(2);

			callback(null, paData.responseDetail);
		});
	},
	order: function(opts, part, user, callback) {
		var client = new Client(),
			reqData = {
				"accountNum": user.partsAuthority.acctNumber,
				"client": 'Parts Detect',
				"userName": user.partsAuthority.user,
				"userPass": user.partsAuthority.password,
				"action": "enterOrder",
				"orderHeader": {
					"cust_name": opts.name,
					"order_num": opts.po,
					"ship_add1": opts.address1,
					"ship_add2": opts.address2.replace('#', ''),
					"ship_city": opts.city,
					"ship_state": opts.state,
					"ship_zip": opts.zip,
					"ship_country": "US",
					"ship_meth": opts.shipping,
					"status": user.mode == 'LIVE' ? process.env.PA_ORDER_STATUS_LIVE : process.env.PA_ORDER_STATUS
				},
				"orderItems": [
					{
						"line_code": opts.lineCode,
						"part_num": opts.partNumber,
						"quantity": opts.qty
					}
				]
			};

		client.get(process.env.PA_ENDPOINT + JSON.stringify(reqData), function (paData, response) {
			paData = JSON.parse(paData);

			if (paData.responseStatus != 'Success') return callback(new Error(paData.responseDetail));

			services.order.record({
				vehicle: part.vehicle.years ? part.vehicle.years[0].year + ' ' + part.vehicle.make.name + ' ' + part.vehicle.model.name + ' ' + (part.vehicle.engine ? part.vehicle.engine.size + ' ' + part.vehicle.engine.cylinder + ' cyl' : '') : '',
				vin: part.vehicle.vin || ''
			}, user, null, [{
				lineCode: opts.lineCode,
				partNumber: opts.partNumber,
				cost: parseFloat(opts.price) ? parseFloat(opts.price) : 0,
				qty: opts.qty
			}], function(err) {if (err) console.log(err);});

			callback(null, paData.responseDetail);
		});
	},
	checkout: function(opts, parts, user, callback) {
		var items = [],
			itemsToRecord = [],
			client = new Client(),
			reqData;

		for (var i = 0; i < parts.length; i++) {
			items.push({
				"line_code": parts[i].checkout.lineCode,
				"part_num": parts[i].checkout.partNumber,
				"quantity": parts[i].checkout.qty || 1
			});

			itemsToRecord.push({
				lineCode: parts[i].checkout.lineCode,
				partNumber: parts[i].checkout.partNumber,
				cost: parseFloat(parts[i].checkout.price) ? parseFloat(parts[i].checkout.price) : 0,
				qty: parts[i].checkout.qty || 1
			});
		}

		reqData = {
			"accountNum": user.partsAuthority.acctNumber,
			"client": 'Parts Detect',
			"userName": user.partsAuthority.user,
			"userPass": user.partsAuthority.password,
			"action": "enterOrder",
			"orderHeader": {
				"cust_name": opts.name,
				"order_num": opts.po,
				"ship_add1": opts.address1,
				"ship_add2": opts.address2.replace('#', ''),
				"ship_city": opts.city,
				"ship_state": opts.state,
				"ship_zip": opts.zip,
				"ship_country": "US",
				"ship_meth": opts.shipping,
				"status": user.mode == 'LIVE' ? process.env.PA_ORDER_STATUS_LIVE : process.env.PA_ORDER_STATUS
			},
			"orderItems": items
		};

		client.get(process.env.PA_ENDPOINT + JSON.stringify(reqData), function (paData, response) {
			var vehicle = parts[0].part.vehicle;

			paData = JSON.parse(paData);

			if (paData.responseStatus != 'Success') return callback(new Error(paData.responseDetail));

			services.order.record({
				vehicle: vehicle.years ? vehicle.years[0].year + ' ' + vehicle.make.name + ' ' + vehicle.model.name + ' ' + (vehicle.engine ? vehicle.engine.size + ' ' + vehicle.engine.cylinder + ' cyl' : '') : '',
				vin: vehicle.vin || ''
			}, user, null, itemsToRecord, null, function(err) {if (err) console.log(err);});

			callback(null, paData.responseDetail);
		});
	},
	verify: function(opts, callback) {
		var client = new Client(),
			reqData = {
				'userName': opts.user,
				'userPass': opts.password,
				'accountNum': opts.acctNumber,
				'client': 'Parts Detect',
				'line_code': process.env.PA_REGISTER_SAMPLE_LINE_CODE,
				'part_number': process.env.PA_REGISTER_SAMPLE_MFG_NUMBER,
				'action': "checkStock"
			};

		client.get(process.env.PA_ENDPOINT + JSON.stringify(reqData), function (paData, response) {
			if (paData.indexOf('Error!') != -1) return callback(new Error(paData));
			paData = JSON.parse(paData);

			callback(null, paData.responseStatus == 'Failed' ? false : true);
		});
	}
};

module.exports = partsAuthority;