var models = require('../models'),
	services = require('../services');

var location = {
	getClosestForPartsAuthority: function(geometry, callback) {
		models.location.find({
			location: {
				$near: {
					$geometry: {
						type: 'Point',
						coordinates: [
							geometry.longitude,
							geometry.latitude
						]
					},
					$minDistance: 0,
					$maxDistance: 100000000000000
				}
			}
		}, null, {skip: 0, limit: 1}, function(err, locations) {
			if (err) return callback(new Error(err));
			if (!locations.length) return callback(new Error(err), {});

			var location = locations[0],
				miles = services.distance.getInMiles(geometry, {
					latitude: location.location.coordinates[1],
					longitude: location.location.coordinates[0]
				});

			location._doc.distance = miles;

			callback(null, location);
		});
	},
	getClosestForAutozone: function(geometry, callback) {
		models.azlocation.find({
			location: {
				$near: {
					$geometry: {
						type: 'Point',
						coordinates: [
							geometry.longitude,
							geometry.latitude
						]
					},
					$minDistance: 0,
					$maxDistance: 100000000000000
				}
			}
		}, null, {skip: 0, limit: 1}, function(err, locations) {
			if (err) return callback(new Error(err));
			if (!locations.length) return callback(new Error(err), {});

			var location = locations[0],
				miles = services.distance.getInMiles(geometry, {
					latitude: location.location.coordinates[1],
					longitude: location.location.coordinates[0]
				});

			location._doc.distance = miles;

			callback(null, location);
		});
	}
};

module.exports = location;