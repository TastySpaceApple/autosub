var path = require('path');
var fs = require('fs');
var express = require('express')
	, app = express();

var open = false;
	
app.use('/', express.static(path.join(__dirname, 'static')));

app.listen(process.env.PORT || 3000);

module.exports = app;
