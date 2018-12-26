var models = require('../models'),
	services = require('./'),
	mysql = require('mysql'),
	async = require('async');

var dataPlanet = {
	getMake: function(callback) {
		var sql = 'SELECT id, title, num_parts FROM data_planet.make';

		services.mysql.getConnection(function (err, connection) {
			if (err) return callback(new Error(err));

			connection.query(sql, function (err, results) {
				connection.release();

				if (err) return callback(new Error(err));

				return callback(null, results);
			});
		});
	},
	getMake2YearByMake: function(make, callback) {
		var sql = 'SELECT id, make, year FROM data_planet.make2year WHERE make = ?',
			inserts = [make];

		services.mysql.getConnection(function (err, connection) {
			if (err) return callback(new Error(err));

			connection.query(mysql.format(sql, inserts), function (err, results) {
				connection.release();

				if (err) return callback(new Error(err));

				return callback(null, results);
			});
		});
	},
	getModelByMake2Year: function(id, callback) {
		var sql = 'SELECT id, title, make2year_id, make, year FROM data_planet.model WHERE make2year_id = ?',
			inserts = [id];

		services.mysql.getConnection(function (err, connection) {
			if (err) return callback(new Error(err));

			connection.query(mysql.format(sql, inserts), function (err, results) {
				connection.release();

				if (err) return callback(new Error(err));

				return callback(null, results);
			});
		});
	},
	getSubModelByModel: function(id, callback) {
		var sql = 'SELECT id, title, model_id, make, year, model FROM data_planet.submodel WHERE model_id = ?',
			inserts = [id];

		services.mysql.getConnection(function (err, connection) {
			if (err) return callback(new Error(err));

			connection.query(mysql.format(sql, inserts), function (err, results) {
				connection.release();

				if (err) return callback(new Error(err));

				return callback(null, results);
			});
		});
	},
	getEngineBySubModel: function(id, callback) {
		var sql = 'SELECT id, title, submodel_id, make, year, model, submodel, num_parts FROM data_planet.engine WHERE submodel_id = ?',
			inserts = [id];

		services.mysql.getConnection(function (err, connection) {
			if (err) return callback(new Error(err));

			connection.query(mysql.format(sql, inserts), function (err, results) {
				connection.release();

				if (err) return callback(new Error(err));

				return callback(null, results);
			});
		});
	},
	getEngineByEdmundsData: function(data, callback) {
		var engines = [],
			sql = 'SELECT id, title, submodel_id, make, year, model, submodel, num_parts ' +
				'FROM data_planet.engine ' +
				'WHERE LOWER(make) = ? ' +
				'AND LOWER(model) = ? ' +
				'AND year = ? ' +
				'AND LOWER(title) LIKE ?',
			inserts = [
				data.make.name.toLowerCase(),
				data.model.name.toLowerCase(),
				data.years[0].year,
				data.engine ? data.engine.cylinder + ' cyl ' + data.engine.size + 'l' : '%'
			];

		services.mysql.getConnection(function (err, connection) {
			if (err) return callback(new Error(err));

			async.series([
				function(callback) {
					connection.query(mysql.format(sql, inserts), function (err, results) {
						if (err) return callback(err);

						engines = results;
						callback();
					});
				},
				function(callback) {
					if (engines.length) return callback();

					sql = 'SELECT id, title, submodel_id, make, year, model, submodel, num_parts ' +
					'FROM data_planet.engine ' +
					'WHERE LOWER(make) = ? ' +
					'AND MATCH(model) AGAINST (? in boolean mode)' +
					'AND year = ? ' +
					'AND LOWER(title) LIKE \'%\'';

					connection.query(mysql.format(sql, inserts), function (err, results) {
						if (err) return callback(err);

						for (var i = 0; i < results.length; i++) {
							results[i].submodel = results[i].model + ' ' + results[i].submodel;
						}

						engines = results;
						callback();
					});
				}
			], function(err) {
				connection.release();

				if (err) return callback(new Error(err));
				if (!engines.length) services.notify.someoneAboutEdmundMatchFailure(data, function() {});

				callback(null, engines);
			});
		});
	}
};

module.exports = dataPlanet;