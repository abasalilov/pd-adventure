var async = require('async');

var distance = {
	getInMiles: function(startGeometry, stopGeometry) {
		var lat1 = parseFloat(startGeometry.latitude),
			lat2 = parseFloat(stopGeometry.latitude),
			lng1 = parseFloat(startGeometry.longitude),
			lng2 = parseFloat(stopGeometry.longitude),
			R = 6371;

		var dLat = this.toRad(lat2 - lat1),
			dLng = this.toRad(lng2 - lng1),
			lat1 = this.toRad(lat1),
			lat2 = this.toRad(lat2);

		var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		var d = R * c;
		var units = d * 1000;
		var miles = (Math.floor((units * 0.00062137) * 100) / 100).toFixed(2);

		return miles;
	},
	toRad: function(val) {
		return val * (Math.PI / 180);
	}
};

module.exports = distance;