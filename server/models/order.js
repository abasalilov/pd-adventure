var mongoose = require('mongoose');

var order = mongoose.Schema({
	date: Date,
	name: String,
	email: String,
	total: Number,
	vin: String,
	vehicle: String,
	autoZone: [{
		lineCode: String,
		partNumber: String,
		shopCost: Number,
		adjustmentAmount: Number,
		sku: String,
		qty: Number
	}],
	partsAuthority: [{
		lineCode: String,
		partNumber: String,
		cost: Number,
		qty: Number
	}],
	advanceAuto: [{
		lineCode: String,
		partNumber: String,
		cost: Number,
		qty: Number
	}]
});


module.exports = mongoose.model('order', order);