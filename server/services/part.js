var models = require('../models'),
	services = require('./'),
	mysql = require('mysql'),
	async = require('async');

var part = {
	search: function(opts, geometry, callback) {
		var partsAuthorityLocation = services.partsAuthority.checkIfClose(geometry),
			sql = 'SELECT p.*, lc.line AS lineCode, pa.?? as stock, pa.cost ' +
				'FROM data_planet.part p ' +
				'INNER JOIN data_planet.engine2part ep ON ep.part_id = p.id ' +
				'INNER JOIN data_planet.partsAuthorityLineCodes lc ON UPPER(p.brand_title) = UPPER(lc.name) ' +
				'INNER JOIN data_planet.partsauthority pa ON pa.line = lc.line AND pa.part = p.manufacturer_number AND pa.?? != 0 ' +
				'WHERE ep.engine_id = ? AND ' +
				'MATCH(p.title, p.part_number, p.manufacturer_number, p.brand_title) ' +
				'AGAINST (? in boolean mode)',
			inserts = [
				partsAuthorityLocation.dailyName,
				partsAuthorityLocation.dailyName,
				opts.engineId,
				opts.searchTerm
			];

		if (opts.partNumber) {
			sql = 'SELECT p.*, lc.line AS lineCode, pa.?? as stock, pa.cost ' +
					'FROM data_planet.part p ' +
					'INNER JOIN data_planet.engine2part ep ON ep.part_id = p.id ' +
					'INNER JOIN data_planet.partsAuthorityLineCodes lc ON UPPER(p.brand_title) = UPPER(lc.name) ' +
					'INNER JOIN data_planet.partsauthority pa ON pa.line = lc.line AND pa.part = p.manufacturer_number AND pa.?? != 0 ' +
					'WHERE MATCH(p.title, p.part_number, p.manufacturer_number, p.brand_title) ' +
					'AGAINST (? in boolean mode)';

			inserts = [
				partsAuthorityLocation.dailyName,
				partsAuthorityLocation.dailyName,
				opts.partNumber
			];
		}

		if (!partsAuthorityLocation.name) return callback(null, []);

		services.mysql.getConnection(function (err, connection) {
			if (err) return callback(new Error(err));

			connection.query(mysql.format(sql, inserts), function (err, results) {
				connection.release();

				if (err) return callback(new Error(err));

				var parts = [];

				for (var i = 0; i < results.length; i++) {
					results[i].hasLineCode = results[i].lineCode ? true : false;
					results[i].partsAuthorityLocation = partsAuthorityLocation;

					parts.push(results[i]);
				}

				return callback(null, parts);
			});
		});
	}
};

module.exports = part;