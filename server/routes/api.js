var express = require("express"),
  router = express.Router(),
  services = require("../services"),
  _ = require("underscore"),
  parseString = require("xml2js").parseString,
  async = require("async");

router.post("/search/autozone", services.auth.restrict, function(
  req,
  res,
  next
) {
  console.log("req.body in /search/autozone", req.body);
  console.log("req.user in /search/autozone", req.user);

  var retObj = {
    geometry: req.body.geometry
      ? JSON.parse(req.body.geometry)
      : { latitude: 0, longitude: 0 },
    autozone: {
      display: false,
      categories: [],
      parts: [],
      vehicle: req.body.vehicle ? JSON.parse(req.body.vehicle) : {},
      location: {},
      err: ""
    }
  };

  async.series(
    [
      function(callback) {
        console.log("async series 1", retObj);
        if (!req.user.autozone.pin) return callback();
        if (req.body.azCategory) return callback();

        retObj.autozone.display = true;

        /********* ADDED FOR ENHANCED SEARCH ***************/
        if (retObj.autozone.vehicle.AaiaLegacyID) return callback();
        /********* ADDED FOR ENHANCED SEARCH ***************/

        services.autoZone.getByVIN(req.body.vin, req.user, function(
          err,
          result
        ) {
          if (err) return callback(err);

          retObj.autozone.vehicle = result;
          callback();
        });
      },
      function(callback) {
        console.log("async series 2", retObj);

        if (!req.user.autozone.pin) return callback();
        if (req.body.azCategory) return callback();

        services.autoZone.searchForKeywordByVIN(
          _.escape(req.body.searchTerm),
          retObj.autozone.vehicle,
          req.user,
          function(err, parts, categories) {
            retObj.autozone.err = err ? err.message || "Search Failed" : null;
            retObj.autozone.display =
              (!parts.length && categories.length) || err ? true : false;
            retObj.autozone.parts = parts;
            retObj.autozone.categories = categories;

            // If one of the categories returned exactly matches our search term, go ahead and select it, which
            // will move the search process along one more step
            req.body.azCategory = JSON.stringify(
              _.find(categories, function(category) {
                return (
                  category.Text[0].toLowerCase() ===
                  req.body.searchTerm.toLowerCase()
                );
              })
            );

            callback();
          }
        );
      },
      function(callback) {
        if (!req.body.azCategory) return callback();

        services.autoZone.navigateByCategory(
          JSON.parse(req.body.azCategory),
          retObj.autozone.vehicle,
          req.user,
          function(err, parts, categories) {
            //if (err) return callback(err);

            retObj.autozone.err = err ? err.message || "Search Failed" : null;
            retObj.autozone.display =
              (!parts.length && categories.length) || err ? true : false;
            retObj.autozone.parts = parts;
            retObj.autozone.categories = categories;

            callback();
          }
        );
      },
      function(callback) {
        console.log("async series 4", retObj);

        if (!req.user.autozone.pin) return callback();

        retObj.autozone.location = { phoneNumber: req.user.autozone.phone };
        callback();

        //services.location.getClosestForAutozone(retObj.geometry, function(err, location) {
        //	if (err) return callback(err);
        //
        //	location.phoneNumber = req.user.autozone.phone;
        //
        //	retObj.autozone.location = location;
        //	callback();
        //});
      }
    ],
    function(err) {
      if (err) return next(err);

      res.send(retObj);
    }
  );
});

router.get("/test", services.auth.restrict, function(req, res, next) {
  var retObj = {
    geometry: req.body.geometry
      ? JSON.parse(req.body.geometry)
      : { latitude: 0, longitude: 0 },
    autozone: {
      display: false,
      categories: [],
      parts: [],
      location: {},
      err: ""
    }
  };

  res.send(retObj);
});

module.exports = router;
