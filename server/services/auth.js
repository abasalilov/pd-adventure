var jwt = require("jwt-simple"),
  services = require("./");

var auth = {
  restrict: function(req, res, next) {
    var token =
      (req.body && req.body.access_token) ||
      (req.query && req.query.access_token) ||
      req.headers["x-access-token"];

    if (!token || token === "null")
      return res.send("Access token invalid", 401);

    try {
      var decoded = jwt.decode(token, process.env.TOKEN_SECRET);
      console.log("decoded", decoded);
      // services.user.get(decoded.iss, function(err, user) {
      //   console.log("user", user);
      //   console.log("err", err);
      //   if (err || !user) return res.send("Access token invalid", 401);
      req.user = {
        api: {
          expires: "2019-12-23T01:54:06.216Z",
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1YzFlZWFiZTM1ZGNlOTM4ZDM1NTc1ODEiLCJleHAiOjE1NzcwNjYwNDYyMTZ9.oBKZp6Snq0M09ahr7ES4BuddTgeaR3sUJ5FxygfubaM"
        },
        providers: ["autozone"],
        autozone: { phone: "6023312706", pin: "764505" },
        partsAuthority: {},
        advanceAuto: {},
        __v: 0,
        password:
          "$2b$10$IVbzwQO/Ma3iODdunVe/P.d275Wf0NKSQz887/YA3n.b4SSTDnO6K",
        email: "alek@aleks.co",
        name: "Aleks",
        mode: "LIVE",
        _id: "5c1eeabe35dce938d3557581"
      };
      return next();
      //   return next();
      // });
    } catch (err) {
      return res.status(401).send("Access token invalid");
    }
  },
  assign: function(req, res, next) {
    var token =
      (req.body && req.body.access_token) ||
      (req.query && req.query.access_token) ||
      req.headers["x-access-token"];

    if (!token || token === "null") return next();

    try {
      var decoded = jwt.decode(token, process.env.TOKEN_SECRET);

      services.user.get(decoded.iss, function(err, user) {
        if (err || !user) return next();

        req.user = user;
        return next();
      });
    } catch (err) {
      return next();
    }
  }
};

module.exports = auth;
