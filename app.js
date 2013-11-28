var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
	res.render('index', { title: 'Express' });
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
var Primus = require('primus');
var primus = new Primus(server, { parser: 'JSON' });
var Application = require('./Game')(primus);

primus.on('connection', function (spark) {
	spark.on('data', function(request) {
		if (request.action && Application[request.action + 'Action']) {
			Application[request.action + 'Action'](spark, request.data);
		}
	});
});
primus.on('disconnection', function(spark) {
	Application['disconnectAction'](spark);
});