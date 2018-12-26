var nodemailer = require('nodemailer'),
	moment = require('moment'),
	ses = require('nodemailer-ses-transport'),
	transporter = nodemailer.createTransport(ses({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_REGION
	})),
	hbs = require('nodemailer-express-handlebars'),
	options = {
		viewEngine: {
			extname: '.hjs',
			layoutsDir: 'views/email/'
		},
		viewPath: 'views/email/',
		extName: '.hjs'
	};

var notify = {
	someoneAboutError: function(err, callback) {
		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: process.env.NOTIFY_TO_ADDRESS,
			subject: 'Parts Detect App Error - ' + err.message,
			text: err.stack
		}, callback);
	},
	someoneAboutEdmundMatchFailure: function(data, callback) {
		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: process.env.NOTIFY_TO_ADDRESS,
			subject: 'Data Planet/Edmunds Match Not Found',
			text: JSON.stringify(data)
		}, callback);
	},
	resetPassword: function(reset, email, callback) {
		transporter.use('compile', hbs(options));

		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: email,
			subject: 'Parts Detect - Password Reset Request',
			template: 'reset-password',
			context: {
				reset: reset
			}
		}, callback);
	},
	accountSignup: function(email, callback) {
		transporter.use('compile', hbs(options));

		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: email,
			bcc: process.env.REGISTER_BCC,
			subject: 'Parts Detect - Account Signup',
			template: 'account-signup',
			context: {}
		}, callback);
	},
	orderConfirmation: function(user, checkout, order, record, callback) {
		var adjAmt = parseFloat(order.azPackageHeader[0].azPackageAdjustments[0].adjustmentAmount[0]);

		callback = callback || function() {};

		transporter.use('compile', hbs(options));

		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: user.email,
			subject: 'Parts Detect - Order Confirmation',
			template: 'order-confirmation',
			context: {
				user: user,
				date: moment().format('MM/DD/YYYY'),
				checkout: checkout,
				description: order.partItem[0].description[0],
				qty: order.partItem[0].quantity[0],
				cost: order.partItem[0].shopCost[0],
				adj: adjAmt,
				adjDescription: order.azPackageHeader[0].azPackageAdjustments[0].adjustmentDescription[0],
				showAdjustment: adjAmt != 0 ? true : false,
				delivery: order.partItem[0].deliveryInfo[0],

				price: parseFloat(record.UserArea[0].YourPrice[0]),
				corePrice: parseFloat(record.Price[0].CoreCost[0]),
				priceAvailable: true,
				corePriceAvailable: parseFloat(record.Price[0].CoreCost[0]) != 0 ? true : false,
				mfg: record.Manufacturer[0],
				partNumber: record.UserArea[0].PartNumber[0],
				description: record.Description[0],
				warranty: record.UserArea[0].Warranty[0],
				images: record.UserArea[0].InformationImage[0].ImageUrl,
				inNetwork: record.UserArea[0].InNetworkAvail[0],
				inStore: record.UserArea[0].StoreAvailable[0],
				atHub: record.UserArea[0].HubAvail[0],
				partType: record.UserArea[0].PartTypeName[0],
				location: record.location,
				itemNumber: record.UserArea[0].ItemNumber[0],
				lineCode: record.UserArea[0].LineCode[0],
				partNumber: record.UserArea[0].PartNumber[0],
				vehicle: record.vehicle.years[0].year + ' ' + record.vehicle.make.name + ' ' + record.vehicle.model.name + ' ' + (record.vehicle.engine ? record.vehicle.engine.size + ' ' + record.vehicle.engine.cylinder + ' cyl' : ''),
				notes: record.UserArea[0].QuickNotes[0],
				techNotes: record.UserArea[0].TechNotes,
				vin: record.vehicle.vin
			}
		}, callback);
	},
	azCheckoutConfirmation: function(user, checkout, order, record, callback) {
		var items = [];

		for (var i = 0; i < order.partItem.length; i++) {
			items.push({
				description: order.partItem[i].description[0],
				qty: order.partItem[i].quantity[0],
				cost: order.partItem[i].shopCost[0],
				corePrice: parseFloat(order.partItem[i].coreInfo ? order.partItem[i].coreInfo[0].coreCost[0] : 0),
				sku: order.partItem[i].catalogIds[0].stockNumber[0].azSKUNumber[0]
			});
		}

		callback = callback || function() {};

		transporter.use('compile', hbs(options));

		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: user.email,
			subject: 'Parts Detect - Order Confirmation',
			template: 'checkout-confirmation',
			context: {
				user: user,
				date: moment().format('MM/DD/YYYY'),
				checkout: checkout,
				items: items
			}
		}, callback);
	},
	advanceAutoOrderConfirmation: function(user, checkout, order, record, callback) {

		var items = [];

		for (var i = 0; i < order.orderedQuantity.length; i++) {
			items.push({
				qty: order.orderedQuantity[i].quantityOrdered,
				cost: order.orderedQuantity[i].buyPrice.amount,
				lineCode: order.orderedQuantity[i].id.line,
				partNumber: order.orderedQuantity[i].id.number,
			});
		}

		callback = callback || function() {};

		transporter.use('compile', hbs(options));

		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: user.email,
			subject: 'Parts Detect - Order Confirmation',
			template: 'orders/advance-auto/confirmation',
			context: {
				user: user,
				date: moment().format('MM/DD/YYYY'),
				checkout: checkout,
				items: items
			}
		}, callback);
	},
	aapRequestLogin: function(data, user, callback) {
		data = data || {};
		user = user || {};

		transporter.use('compile', hbs(options));

		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: process.env.AA_REQUESTED_LOGIN_ADDRESS,
			cc: process.env.AA_ACCOUNT_VERIFIED_ADDRESS,
			subject: 'Parts Detect Mechanic Requesting AAP Login',
			template: 'aap-request-login',
			context: {
				data: data,
				user: user,
			}
		}, callback);
	},
	aapVerified: function(data, user, callback) {
		if (!user) return callback();

		transporter.use('compile', hbs(options));

		transporter.sendMail({
			from: process.env.NOTIFY_FROM_ADDRESS,
			to: process.env.AA_ACCOUNT_VERIFIED_ADDRESS,
			subject: 'Parts Detect Mechanic Verified AAP',
			template: 'aap-verified',
			context: {
				data: data,
				user: user,
			}
		}, callback);
	}
};

module.exports = notify;