var path = require("path"),
  models = require("../models"),
  services = require("./"),
  async = require("async"),
  request = require("request"),
  parseString = require("xml2js").parseString,
  _ = require("underscore"),
  XML_CHAR_MAP = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;"
  };

var autoZone = {
  escapeXml: function(s) {
    return s.replace(/[<>&"']/g, function(ch) {
      return XML_CHAR_MAP[ch];
    });
  },
  parseOutResponse: function(xml, callback) {
    var wrapper, response;

    async.series(
      [
        // First parse out the headers
        function(callback) {
          parseString(xml, function(err, json) {
            if (err) return callback(err);

            wrapper = json;
            callback();
          });
        },
        function(callback) {
          parseString(
            wrapper["soapenv:Envelope"]["soapenv:Body"][0][
              "ns:navigateResponse"
            ][0]["ns:return"][0],
            function(err, json) {
              if (err) return callback(err);

              response = json;
              callback();
            }
          );
        }
      ],
      function(err) {
        if (err) return callback(new Error(err));

        callback(null, response);
      }
    );
  },
  getByVIN: function(vin, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID>630743917086</GUID><RequestMode>VinLookup</RequestMode><VIN>' +
              vin +
              "</VIN><SourceID>" +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN></UserArea><Vehicle/></NavigateRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      if (err) return callback(new Error(err));

      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err));

        if (!result.NavigateResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.NavigateResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
            )
          );

        callback(null, result.NavigateResponse.Vehicle[0]);
      });
    });
  },
  searchForKeywordByVIN: function(keyword, vehicle, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><SearchRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID></GUID><SearchType>PartKeyword</SearchType><SourceID>' +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN></UserArea><Vehicle><AaiaLegacyID>" +
              vehicle.AaiaLegacyID[0] +
              "</AaiaLegacyID><UserArea><AzId>" +
              vehicle.UserArea[0].AzId +
              "</AzId></UserArea></Vehicle><SearchCriteria>" +
              keyword +
              "</SearchCriteria></SearchRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err), []);

        if (!result.SearchResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.SearchResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.SearchResponse.Response[0].MessageList[0].Message[0].Description[0]
            ),
            [],
            []
          );

        var parts = [],
          categories = result.SearchResponse.NavigationResults[0].NavigationList
            ? result.SearchResponse.NavigationResults[0].NavigationList[0]
                .NavigationItem
            : [];

        if (result.SearchResponse.NavigationResults[0].PartInformation) {
          for (
            var i = 0;
            i <
            result.SearchResponse.NavigationResults[0].PartInformation.length;
            i++
          ) {
            var part =
                result.SearchResponse.NavigationResults[0].PartInformation[i],
              totalAvail =
                parseInt(part.UserArea[0].HubAvail[0]) +
                parseInt(part.UserArea[0].InNetworkAvail[0]) +
                parseInt(part.UserArea[0].StoreAvailable[0]);

            if (totalAvail) parts.push(part);
          }
        }

        callback(null, parts, categories);
      });
    });
  },
  searchByPartNumber: function(partNumber, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><SearchRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID></GUID><SearchType>PartNumber</SearchType><SourceID>' +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN></UserArea><SearchCriteria>" +
              partNumber +
              "</SearchCriteria></SearchRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err), [], []);

        if (!result.SearchResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.SearchResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.SearchResponse.Response[0].MessageList[0].Message[0].Description[0]
            ),
            [],
            []
          );

        var parts = [],
          categories = result.SearchResponse.NavigationResults[0].NavigationList
            ? result.SearchResponse.NavigationResults[0].NavigationList[0]
                .NavigationItem
            : [];

        if (result.SearchResponse.NavigationResults[0].PartInformation) {
          for (
            var i = 0;
            i <
            result.SearchResponse.NavigationResults[0].PartInformation.length;
            i++
          ) {
            var part =
                result.SearchResponse.NavigationResults[0].PartInformation[i],
              totalAvail =
                parseInt(part.UserArea[0].HubAvail[0]) +
                parseInt(part.UserArea[0].InNetworkAvail[0]) +
                parseInt(part.UserArea[0].StoreAvailable[0]);

            if (totalAvail) parts.push(part);
          }
        }

        callback(null, parts, categories);
      });
    });
  },
  navigateByPartNumberByCategory: function(category, vehicle, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      requestBody =
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
        '<NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        "<NavigationItem>" +
        "<Text>" +
        _.escape(category.Text[0]) +
        "</Text>" +
        "<ServerItemID>" +
        category.ServerItemID[0] +
        "</ServerItemID>" +
        "<UserArea>" +
        "<ItemType>" +
        category.UserArea[0].ItemType[0] +
        "</ItemType>" +
        (category.UserArea[0].ItemCategory
          ? "<ItemCategory>" +
            category.UserArea[0].ItemCategory[0] +
            "</ItemCategory>"
          : "") +
        (category.UserArea[0].SearchSettings
          ? "<SearchSettings>" +
            "<SearchCriteria>" +
            (category.UserArea[0].SearchSettings
              ? category.UserArea[0].SearchSettings[0].SearchCriteria[0]
              : "") +
            "</SearchCriteria>" +
            "<SearchType>" +
            (category.UserArea[0].SearchSettings
              ? category.UserArea[0].SearchSettings[0].SearchType[0]
              : "") +
            "</SearchType>" +
            "</SearchSettings>"
          : "") +
        "</UserArea>" +
        "</NavigationItem>" +
        "<UserArea>" +
        "<GUID></GUID>" +
        "<SourceID>" +
        srcId +
        "</SourceID>" +
        "<AzPIN>" +
        user.autozone.pin +
        "</AzPIN>" +
        "</UserArea>" +
        "</NavigateRequest>";

    request(
      {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(requestBody) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      },
      function(err, response, body) {
        self.parseOutResponse(body, function(err, result) {
          if (err) return callback(new Error(err));

          if (!result.NavigateResponse) {
            services.notify.someoneAboutError(
              {
                message: "AutoZone Error",
                stack: JSON.stringify({
                  request: requestBody,
                  response: body
                })
              },
              function() {}
            );

            return callback(
              new Error(
                "We encountered an error communicating with AutoZone. Please try your search again."
              )
            );
          }

          if (result.NavigateResponse.Response[0].Status[0] == "Fail")
            return callback(
              new Error(
                result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
              ),
              [],
              []
            );

          var parts = [],
            categories = result.NavigateResponse.NavigationResults[0]
              .NavigationList
              ? result.NavigateResponse.NavigationResults[0].NavigationList[0]
                  .NavigationItem
              : [];

          if (result.NavigateResponse.NavigationResults[0].PartInformation) {
            for (
              var i = 0;
              i <
              result.NavigateResponse.NavigationResults[0].PartInformation
                .length;
              i++
            ) {
              var part =
                  result.NavigateResponse.NavigationResults[0].PartInformation[
                    i
                  ],
                totalAvail =
                  parseInt(part.UserArea[0].HubAvail[0]) +
                  parseInt(part.UserArea[0].InNetworkAvail[0]) +
                  parseInt(part.UserArea[0].StoreAvailable[0]);

              if (totalAvail) parts.push(part);
            }
          }

          callback(null, parts, categories);
        });
      }
    );
  },
  navigateByCategory: function(category, vehicle, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      requestBody =
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
        '<NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        "<NavigationItem>" +
        "<Text>" +
        _.escape(category.Text[0]) +
        "</Text>" +
        "<ServerItemID>" +
        category.ServerItemID[0] +
        "</ServerItemID>" +
        "<UserArea>" +
        "<ItemType>" +
        category.UserArea[0].ItemType[0] +
        "</ItemType>" +
        (category.UserArea[0].ItemCategory
          ? "<ItemCategory>" +
            category.UserArea[0].ItemCategory[0] +
            "</ItemCategory>"
          : "") +
        (category.UserArea[0].SearchSettings
          ? "<SearchSettings>" +
            "<SearchCriteria>" +
            (category.UserArea[0].SearchSettings
              ? _.escape(
                  category.UserArea[0].SearchSettings[0].SearchCriteria[0]
                )
              : "") +
            "</SearchCriteria>" +
            "<SearchType>" +
            (category.UserArea[0].SearchSettings
              ? category.UserArea[0].SearchSettings[0].SearchType[0]
              : "") +
            "</SearchType>" +
            "</SearchSettings>"
          : "") +
        "</UserArea>" +
        "</NavigationItem>" +
        "<UserArea>" +
        "<GUID></GUID>" +
        "<SourceID>" +
        srcId +
        "</SourceID>" +
        "<AzPIN>" +
        user.autozone.pin +
        "</AzPIN>" +
        "</UserArea>" +
        "<Vehicle>" +
        "<AaiaLegacyID>" +
        vehicle.AaiaLegacyID[0] +
        "</AaiaLegacyID>" +
        "<UserArea>" +
        "<AzId>" +
        vehicle.UserArea[0].AzId +
        "</AzId>" +
        "<Year></Year>" +
        "<Make></Make>" +
        "<Model></Model>" +
        "<EngineLiter></EngineLiter>" +
        "<EngineType></EngineType>" +
        "<Submodel></Submodel>" +
        "<Fuel></Fuel>" +
        "<CylCode/>" +
        "<ModelDesc></ModelDesc>" +
        "</UserArea>" +
        "</Vehicle>" +
        "</NavigateRequest>";

    request(
      {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(requestBody) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      },
      function(err, response, body) {
        self.parseOutResponse(body, function(err, result) {
          if (err) return callback(new Error(err), [], []);

          if (!result.NavigateResponse) {
            services.notify.someoneAboutError(
              {
                message: "AutoZone Error",
                stack: JSON.stringify({
                  request: requestBody,
                  response: body
                })
              },
              function() {}
            );

            return callback(
              new Error(
                "We encountered an error communicating with AutoZone. Please try your search again."
              ),
              [],
              []
            );
          }

          if (result.NavigateResponse.Response[0].Status[0] == "Fail")
            return callback(
              new Error(
                result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
              ),
              [],
              []
            );

          var parts = [],
            categories = result.NavigateResponse.NavigationResults[0]
              .NavigationList
              ? result.NavigateResponse.NavigationResults[0].NavigationList[0]
                  .NavigationItem
              : [];

          if (result.NavigateResponse.NavigationResults[0].PartInformation) {
            for (
              var i = 0;
              i <
              result.NavigateResponse.NavigationResults[0].PartInformation
                .length;
              i++
            ) {
              var part =
                  result.NavigateResponse.NavigationResults[0].PartInformation[
                    i
                  ],
                totalAvail =
                  parseInt(part.UserArea[0].HubAvail[0]) +
                  parseInt(part.UserArea[0].InNetworkAvail[0]) +
                  parseInt(part.UserArea[0].StoreAvailable[0]);

              if (totalAvail) parts.push(part);
            }
          }

          callback(null, parts, categories);
        });
      }
    );
  },
  verify: function(opts, callback) {
    var self = this,
      srcId = process.env.AZ_SRC_ID_LIVE,
      endPoint = process.env.AZ_ENDPOINT_ORDER_LIVE,
      options = {
        method: "POST",
        url: endPoint,
        body:
          '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://azeo.autozone.com/service/">' +
          "<soapenv:Header/>" +
          "<soapenv:Body>" +
          '<ser:getNewPassword sourceId="' +
          srcId +
          '" version="1.0">' +
          "<pin>" +
          opts.pin +
          "</pin>" +
          "</ser:getNewPassword>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      parseString(body, function(err, json) {
        if (err) return callback(new Error(err));

        if (json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"]) {
          return callback(null, false);
        }

        callback(null, true);
      });
    });
  },
  getQuote: function(sku, qty, user, callback) {
    var password,
      quote,
      self = this;

    async.series(
      [
        function(callback) {
          self._openRequest(user, function(err, result) {
            password = result;

            callback(err);
          });
        },
        function(callback) {
          self._getQuote(password, sku, qty, user, function(err, result) {
            quote = result;

            callback(err);
          });
        }
      ],
      function(err) {
        if (err) return callback(new Error(err));

        callback(null, quote);
      }
    );
  },
  getQuoteForCheckout: function(parts, user, callback) {
    var password,
      quote,
      self = this;

    async.series(
      [
        function(callback) {
          self._openRequest(user, function(err, result) {
            password = result;

            callback(err);
          });
        },
        function(callback) {
          self._getQuoteForCheckout(password, parts, user, function(
            err,
            result
          ) {
            quote = result;

            callback(err);
          });
        }
      ],
      function(err) {
        if (err) return callback(new Error(err));

        callback(null, quote);
      }
    );
  },
  getOrder: function(checkout, part, user, callback) {
    var password,
      order,
      self = this;

    async.series(
      [
        function(callback) {
          self._openRequest(user, function(err, result) {
            password = result;

            callback(err);
          });
        },
        function(callback) {
          self._getOrder(
            password,
            checkout.sku,
            checkout.qty,
            checkout,
            user,
            function(err, result) {
              order = result;

              callback(err);
            }
          );
        },
        function(callback) {
          var shopCost = order.partItem[0].shopCost[0],
            adjAmount =
              order.azPackageHeader[0].azPackageAdjustments[0]
                .adjustmentAmount[0];

          services.order.record(
            {
              vehicle: part.vehicle.years
                ? part.vehicle.years[0].year +
                  " " +
                  part.vehicle.make.name +
                  " " +
                  part.vehicle.model.name +
                  " " +
                  (part.vehicle.engine
                    ? part.vehicle.engine.size +
                      " " +
                      part.vehicle.engine.cylinder +
                      " cyl"
                    : "")
                : "",
              vin: part.vehicle.vin || ""
            },
            user,
            [
              {
                shopCost: parseFloat(shopCost) ? parseFloat(shopCost) : 0,
                adjAmount: parseFloat(adjAmount) ? parseFloat(adjAmount) : 0,
                sku: checkout.sku,
                qty: checkout.qty,
                lineCode: part.UserArea[0].LineCode[0],
                partNumber: part.UserArea[0].PartNumber[0]
              }
            ],
            null,
            callback
          );
        }
      ],
      function(err) {
        callback(err, order);
      }
    );
  },
  checkout: function(checkout, parts, user, callback) {
    var password,
      order,
      self = this;

    async.series(
      [
        function(callback) {
          self._openRequest(user, function(err, result) {
            password = result;

            callback(err);
          });
        },
        function(callback) {
          self._checkout(password, parts, checkout, user, function(
            err,
            result
          ) {
            order = result;

            callback(err);
          });
        },
        function(callback) {
          var shopCost = order.partItem[0].shopCost[0],
            adjAmount =
              order.azPackageHeader[0].azPackageAdjustments[0]
                .adjustmentAmount[0],
            vehicle = parts[0].part.vehicle,
            itemsToRecord = [];

          for (var i = 0; i < parts.length; i++) {
            itemsToRecord.push({
              shopCost: parseFloat(shopCost) ? parseFloat(shopCost) : 0,
              adjAmount: parseFloat(adjAmount) ? parseFloat(adjAmount) : 0,
              sku: parts[i].checkout.sku,
              qty: parts[i].checkout.qty || 1,
              lineCode: parts[i].checkout.lineCode,
              partNumber: parts[i].checkout.partNumber
            });
          }

          services.order.record(
            {
              vehicle: vehicle.years
                ? vehicle.years[0].year +
                  " " +
                  vehicle.make.name +
                  " " +
                  vehicle.model.name +
                  " " +
                  (vehicle.engine
                    ? vehicle.engine.size +
                      " " +
                      vehicle.engine.cylinder +
                      " cyl"
                    : "")
                : "",
              vin: vehicle.vin || ""
            },
            user,
            itemsToRecord,
            null,
            null,
            callback
          );
        }
      ],
      function(err) {
        callback(err, order);
      }
    );
  },
  getYears: function(user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID></GUID><ItemType>YearList</ItemType><SourceID>' +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN></UserArea><Vehicle/></NavigateRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err));

        if (!result.NavigateResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.NavigateResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
            )
          );

        var years = [];

        for (
          var i = 0;
          i <
          result.NavigateResponse.NavigationResults[0].NavigationList[0]
            .NavigationItem.length;
          i++
        ) {
          var year =
            result.NavigateResponse.NavigationResults[0].NavigationList[0]
              .NavigationItem[i];

          years.push({
            text: year.Text[0],
            id: year.ServerItemID[0]
          });
        }

        callback(null, years);
      });
    });
  },
  getMakes: function(year, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID></GUID><SourceID>' +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN></UserArea><NavigationItem><Text>" +
              year.text +
              "</Text><ServerItemID>" +
              year.id +
              "</ServerItemID><UserArea><ItemType>Year</ItemType></UserArea></NavigationItem></NavigateRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err));

        if (!result.NavigateResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.NavigateResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
            )
          );

        var makes = [];

        for (
          var i = 0;
          i <
          result.NavigateResponse.NavigationResults[0].NavigationList[0]
            .NavigationItem.length;
          i++
        ) {
          var make =
            result.NavigateResponse.NavigationResults[0].NavigationList[0]
              .NavigationItem[i];

          makes.push({
            text: make.Text[0],
            id: make.ServerItemID[0]
          });
        }

        callback(null, makes);
      });
    });
  },
  getModels: function(make, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID></GUID><SourceID>' +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN></UserArea><NavigationItem><Text>" +
              make.text +
              "</Text><ServerItemID>" +
              make.id +
              "</ServerItemID><UserArea><ItemType>Make</ItemType></UserArea></NavigationItem></NavigateRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err));

        if (!result.NavigateResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.NavigateResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
            )
          );

        var models = [];

        for (
          var i = 0;
          i <
          result.NavigateResponse.NavigationResults[0].NavigationList[0]
            .NavigationItem.length;
          i++
        ) {
          var model =
            result.NavigateResponse.NavigationResults[0].NavigationList[0]
              .NavigationItem[i];

          models.push({
            text: model.Text[0],
            id: model.ServerItemID[0]
          });
        }

        callback(null, models);
      });
    });
  },
  getEngines: function(model, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID></GUID><SourceID>' +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN></UserArea><NavigationItem><Text>" +
              model.text +
              "</Text><ServerItemID>" +
              model.id +
              "</ServerItemID><UserArea><ItemType>Model</ItemType></UserArea></NavigationItem></NavigateRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err));

        if (!result.NavigateResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.NavigateResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
            )
          );

        var engines = [];

        for (
          var i = 0;
          i <
          result.NavigateResponse.NavigationResults[0].NavigationList[0]
            .NavigationItem.length;
          i++
        ) {
          var engine =
            result.NavigateResponse.NavigationResults[0].NavigationList[0]
              .NavigationItem[i];

          engines.push({
            text: engine.Text[0],
            id: engine.ServerItemID[0]
          });
        }

        callback(null, engines);
      });
    });
  },
  getVehicleByEngine: function(engine, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID></GUID><SourceID>' +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN></UserArea><NavigationItem><Text>" +
              engine.text +
              "</Text><ServerItemID>" +
              engine.id +
              "</ServerItemID><UserArea><ItemType>Engine</ItemType></UserArea></NavigationItem></NavigateRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err));

        if (!result.NavigateResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.NavigateResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
            )
          );

        callback(null, result.NavigateResponse.Vehicle[0]);
      });
    });
  },
  getVehicleByVIN: function(vin, user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_LIVE
          : process.env.AZ_ENDPOINT,
      options = {
        method: "POST",
        url: endPoint,
        headers: {
          "Content-Type":
            'application/soap+xml; charset=UTF-8; action="urn:navigate"'
        },
        body:
          '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope">' +
          "<soapenv:Body>" +
          '<ns1:navigate xmlns:ns1="http://webservice.aftersoft.autozone.com">' +
          "<ns1:xmlMessage>" +
          this.escapeXml(
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?><NavigateRequest xmlns="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:ishop="http://www.aftermarket.org/iShop/V3/XMLSchema" xmlns:vehicle="http://www.aftermarket.org/iShop/V3/ACESVehicle" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><UserArea><GUID></GUID><SourceID>' +
              srcId +
              "</SourceID><AzPIN>" +
              user.autozone.pin +
              "</AzPIN><RequestMode>VinLookup</RequestMode><VIN>" +
              vin +
              "</VIN></UserArea></NavigateRequest>"
          ) +
          "</ns1:xmlMessage>" +
          "</ns1:navigate>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      self.parseOutResponse(body, function(err, result) {
        if (err) return callback(new Error(err));

        if (!result.NavigateResponse) {
          services.notify.someoneAboutError(
            {
              message: "AutoZone Error",
              stack: JSON.stringify({
                request: options,
                response: body
              })
            },
            function() {}
          );

          return callback(
            new Error(
              "We encountered an error communicating with AutoZone. Please try your search again."
            )
          );
        }

        if (result.NavigateResponse.Response[0].Status[0] == "Fail")
          return callback(
            new Error(
              result.NavigateResponse.Response[0].MessageList[0].Message[0].Description[0]
            )
          );

        callback(null, result.NavigateResponse.Vehicle[0]);
      });
    });
  },
  _openRequest: function(user, callback) {
    var self = this,
      srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_ORDER_LIVE
          : process.env.AZ_ENDPOINT_ORDER,
      options = {
        method: "POST",
        url: endPoint,
        body:
          '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://azeo.autozone.com/service/">' +
          "<soapenv:Header/>" +
          "<soapenv:Body>" +
          '<ser:getNewPassword sourceId="' +
          srcId +
          '" version="1.0">' +
          "<pin>" +
          user.autozone.pin +
          "</pin>" +
          "</ser:getNewPassword>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      parseString(body, function(err, json) {
        if (
          json["soapenv:Envelope"]["soapenv:Body"][0][
            "ns1:getNewPasswordResponse"
          ][0].errorResponse
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getNewPasswordResponse"
            ][0].errorResponse[0].result[0].text[0]
          );
        }

        callback(
          null,
          json["soapenv:Envelope"]["soapenv:Body"][0][
            "ns1:getNewPasswordResponse"
          ][0].security[0].azPassword[0]
        );
      });
    });
  },
  _getQuote: function(password, sku, qty, user, callback) {
    var srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_ORDER_LIVE
          : process.env.AZ_ENDPOINT_ORDER,
      options = {
        method: "POST",
        url: endPoint,
        body:
          '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://azeo.autozone.com/service/">' +
          "<soapenv:Header/>" +
          "<soapenv:Body>" +
          '<ser:getQuote sourceId="' +
          srcId +
          '" version="1.0">' +
          '<security version="1.0">' +
          "<azPin>" +
          user.autozone.pin +
          "</azPin>" +
          "<azPassword>" +
          password +
          "</azPassword>" +
          "</security>" +
          '<azPackageHeader version="1.0">' +
          "<deliveryRequest>Deliver</deliveryRequest>" +
          "<shipWhole>Yes</shipWhole>" +
          "</azPackageHeader>" +
          '<partItem version="1.0">' +
          '<catalogIds version="1.0">' +
          '<stockNumber version="1.0">' +
          "<azSKUNumber>" +
          sku +
          "</azSKUNumber>" +
          "</stockNumber>" +
          "</catalogIds>" +
          "<quantity>" +
          qty +
          "</quantity>" +
          "</partItem>" +
          "</ser:getQuote>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      parseString(body, function(err, json) {
        if (json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"][0]) {
          return callback(
            "An error was encountered: " +
              json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"][0]
                .faultstring[0]
          );
        }

        if (
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getQuoteResponse"][0]
            .errorResponse
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getQuoteResponse"
            ][0].errorResponse[0].result[0].text[0]
          );
        }

        if (
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getQuoteResponse"][0]
            .azPackage[0].azPackageHeader[0].azPackageCurrentStatus[0]
            .state[0] == "Error"
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getQuoteResponse"
            ][0].azPackage[0].azPackageHeader[0].azPackageCurrentStatus[0]
              .result[0].text[0]
          );
        }

        callback(
          null,
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getQuoteResponse"][0]
            .azPackage[0]
        );
      });
    });
  },
  _getQuoteForCheckout: function(password, parts, user, callback) {
    var srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_ORDER_LIVE
          : process.env.AZ_ENDPOINT_ORDER,
      items = "",
      options;

    for (var i = 0; i < parts.length; i++) {
      items +=
        '<partItem version="1.0">' +
        '<catalogIds version="1.0">' +
        '<stockNumber version="1.0">' +
        "<azSKUNumber>" +
        parts[i].checkout.sku +
        "</azSKUNumber>" +
        "</stockNumber>" +
        "</catalogIds>" +
        "<quantity>" +
        (parts[i].checkout.qty || 1) +
        "</quantity>" +
        "</partItem>";
    }

    options = {
      method: "POST",
      url: endPoint,
      body:
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://azeo.autozone.com/service/">' +
        "<soapenv:Header/>" +
        "<soapenv:Body>" +
        '<ser:getQuote sourceId="' +
        srcId +
        '" version="1.0">' +
        '<security version="1.0">' +
        "<azPin>" +
        user.autozone.pin +
        "</azPin>" +
        "<azPassword>" +
        password +
        "</azPassword>" +
        "</security>" +
        '<azPackageHeader version="1.0">' +
        "<deliveryRequest>Deliver</deliveryRequest>" +
        "<shipWhole>Yes</shipWhole>" +
        "</azPackageHeader>" +
        items +
        "</ser:getQuote>" +
        "</soapenv:Body>" +
        "</soapenv:Envelope>"
    };

    request(options, function(err, response, body) {
      parseString(body, function(err, json) {
        if (json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"]) {
          return callback(
            "An error was encountered: " +
              json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"][0]
                .faultstring[0]
          );
        }

        if (
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getQuoteResponse"][0]
            .errorResponse
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getQuoteResponse"
            ][0].errorResponse[0].result[0].text[0]
          );
        }

        if (
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getQuoteResponse"][0]
            .azPackage[0].azPackageHeader[0].azPackageCurrentStatus[0]
            .state[0] == "Error"
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getQuoteResponse"
            ][0].azPackage[0].azPackageHeader[0].azPackageCurrentStatus[0]
              .result[0].text[0]
          );
        }

        callback(
          null,
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getQuoteResponse"][0]
            .azPackage[0]
        );
      });
    });
  },
  _getOrder: function(password, sku, qty, opts, user, callback) {
    var srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_ORDER_LIVE
          : process.env.AZ_ENDPOINT_ORDER,
      options = {
        method: "POST",
        url: endPoint,
        body:
          '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://azeo.autozone.com/service/">' +
          "<soapenv:Header/>" +
          "<soapenv:Body>" +
          '<ser:getOrder sourceId="' +
          srcId +
          '" version="1.0">' +
          '<security version="1.0">' +
          "<azPin>" +
          user.autozone.pin +
          "</azPin>" +
          "<azPassword>" +
          password +
          "</azPassword>" +
          "</security>" +
          '<azPackageHeader version="1.0">' +
          "<purchaseOrderNumber>" +
          opts.po +
          "</purchaseOrderNumber>" +
          "<deliveryRequest>Deliver</deliveryRequest>" +
          "<shipWhole>Yes</shipWhole>" +
          "<noteToStore>" +
          opts.notes +
          "</noteToStore>" +
          "</azPackageHeader>" +
          '<partItem version="1.0">' +
          '<catalogIds version="1.0">' +
          '<stockNumber version="1.0">' +
          "<azSKUNumber>" +
          sku +
          "</azSKUNumber>" +
          "</stockNumber>" +
          "</catalogIds>" +
          "<quantity>" +
          qty +
          "</quantity>" +
          "</partItem>" +
          "</ser:getOrder>" +
          "</soapenv:Body>" +
          "</soapenv:Envelope>"
      };

    request(options, function(err, response, body) {
      parseString(body, function(err, json) {
        if (json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"]) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"][0]
              .faultstring[0]
          );
        }

        if (
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getOrderResponse"][0]
            .errorResponse
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getOrderResponse"
            ][0].errorResponse[0].result[0].text[0]
          );
        }

        if (
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getOrderResponse"][0]
            .azPackage[0].partItem[0].partCurrentStatus[0].state[0] != "Ordered"
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getOrderResponse"
            ][0].azPackage[0].partItem[0].partCurrentStatus[0].result[0].text[0]
          );
        }

        callback(
          null,
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getOrderResponse"][0]
            .azPackage[0]
        );
      });
    });
  },
  _checkout: function(password, parts, opts, user, callback) {
    var srcId =
        user.mode == "LIVE"
          ? process.env.AZ_SRC_ID_LIVE
          : process.env.AZ_SRC_ID,
      endPoint =
        user.mode == "LIVE"
          ? process.env.AZ_ENDPOINT_ORDER_LIVE
          : process.env.AZ_ENDPOINT_ORDER,
      items = [],
      options;

    for (var i = 0; i < parts.length; i++) {
      items +=
        '<partItem version="1.0">' +
        '<catalogIds version="1.0">' +
        // '<stockNumber version="1.0">' +
        // '<azSKUNumber>' + parts[i].checkout.sku + '</azSKUNumber>' +
        // '</stockNumber>' +
        "<lineCodePartNumber>" +
        "<azLineCode>" +
        parts[i].checkout.lineCode +
        "</azLineCode>" +
        "<azPartNumber>" +
        parts[i].checkout.partNumber +
        "</azPartNumber>" +
        "<azSKUNumber>" +
        parts[i].checkout.sku +
        "</azSKUNumber>" +
        "</lineCodePartNumber>" +
        "</catalogIds>" +
        "<quantity>" +
        (parts[i].checkout.qty || 1) +
        "</quantity>" +
        "</partItem>";
    }

    options = {
      method: "POST",
      url: endPoint,
      body:
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://azeo.autozone.com/service/">' +
        "<soapenv:Header/>" +
        "<soapenv:Body>" +
        '<ser:getOrder sourceId="' +
        srcId +
        '" version="1.0">' +
        '<security version="1.0">' +
        "<azPin>" +
        user.autozone.pin +
        "</azPin>" +
        "<azPassword>" +
        password +
        "</azPassword>" +
        "</security>" +
        '<azPackageHeader version="1.0">' +
        "<purchaseOrderNumber>" +
        opts.po +
        "</purchaseOrderNumber>" +
        "<deliveryRequest>Deliver</deliveryRequest>" +
        "<shipWhole>Yes</shipWhole>" +
        "<noteToStore>" +
        opts.notes +
        "</noteToStore>" +
        "</azPackageHeader>" +
        items +
        "</ser:getOrder>" +
        "</soapenv:Body>" +
        "</soapenv:Envelope>"
    };

    request(options, function(err, response, body) {
      parseString(body, function(err, json) {
        if (json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"]) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0]["soapenv:Fault"][0]
              .faultstring[0]
          );
        }

        if (
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getOrderResponse"][0]
            .errorResponse
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getOrderResponse"
            ][0].errorResponse[0].result[0].text[0]
          );
        }

        if (
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getOrderResponse"][0]
            .azPackage[0].partItem[0].partCurrentStatus[0].state[0] != "Ordered"
        ) {
          return callback(
            json["soapenv:Envelope"]["soapenv:Body"][0][
              "ns1:getOrderResponse"
            ][0].azPackage[0].partItem[0].partCurrentStatus[0].result[0].text[0]
          );
        }

        callback(
          null,
          json["soapenv:Envelope"]["soapenv:Body"][0]["ns1:getOrderResponse"][0]
            .azPackage[0]
        );
      });
    });
  }
};

module.exports = autoZone;
