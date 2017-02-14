'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _lokka = require('lokka');

var _lokkaTransportHttp = require('lokka-transport-http');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var client = new _lokka.Lokka({
  transport: new _lokkaTransportHttp.Transport('https://api.graph.cool/simple/v1/cixppm9cl0im50169lsgk7g2o')
});

var fetchHistory = function fetchHistory() {
  return client.query('\n    {\n      allSearches(orderBy: createdAt_DESC) {\n        createdAt\n        query\n      }\n    }\n  ');
};

var fetchImages = function fetchImages() {
  var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '{description_contains: ""}';
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return client.query('\n    {\n      allPosts(first:10, filter: ' + filter + ', skip: ' + offset + ') {\n        imageUrl\n        description\n      }\n    }\n  ');
};

var addToHistory = function addToHistory(query) {
  return client.mutate('\n    {\n      createSearch(query: "' + query + '") {\n        query\n      }\n    }\n  ');
};

var createFilter = function createFilter(query) {
  var array = query.split(' ');
  var filter = '{description_contains: "' + array[0] + '"';
  if (array.length > 1) {
    array.slice(1).forEach(function (term) {
      filter += ', AND: {description_contains: "' + term + '"';
    });
  }
  array.forEach(function () {
    filter += '}';
  });
  return filter;
};

var dbCall = function dbCall(query, offset) {
  var filter = createFilter(query);
  addToHistory(query);
  return fetchImages(filter).then(function (res) {
    return res;
  });
};

var app = (0, _express2.default)();

app.get('/', function (req, res) {
  var search = req.query.search;
  var offset = req.query.offset || 0;
  var filter = search ? createFilter(search) : '{description_contains: ""}';
  if (search) {
    addToHistory(search);
  }
  fetchImages(filter, offset).then(function (results) {
    return res.json(results);
  });
});

app.get('/history', function (req, res) {
  fetchHistory().then(function (results) {
    return res.json(results);
  });
});

app.listen(process.env.PORT || 5000);
