// require Express and Socket.io
var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var config = require('./config.js');

// the object that will hold information about the active users currently
// on the site
var visitorsData = {};

app.set('port', (process.env.PORT || 8888));

// from the public/ directory
app.use(express.static(path.join(__dirname, 'public/')));

// serve the index.html
app.get(/\/?$/, function(req, res) {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});











http.listen(app.get('port'), function() {
  console.log('listening on port ' + app.get('port'));
});
