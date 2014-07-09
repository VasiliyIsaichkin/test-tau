var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var jar = request.jar();
request = request.defaults({jar : jar});
var xml2json = require('xml2json');
var url = require('url');
var config = require('nconf');
var cheerio = require('cheerio');
var libxmljs = require('libxmljs');
var Iconv = require('iconv').Iconv;
var translator = new Iconv('cp1251', 'utf-8');

config.file({
	file : __dirname + '/config.json'
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

function checkPermission(where){
	var queryData = url.parse(where, true).query;
	return queryData.key === 'test';
}
function checkInt(int){
	return parseInt(int) == int;
}

function requestUrl(url, cb, mask){
	mask = mask || false;
	opt = {url : url, encoding : null};
	if (mask){
		opt['headers'] = {
			'User-Agent'      : 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36',
			'Accept'          : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Accept-Language' : 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
			'Cache-Control'   : 'max-age',
			'Connection'      : 'keep-alive',
			'Host'            : 'www.kinopoisk.ru'
		};
	}
	return request(opt, function(err, res, body){
		cb(err, res, body);
	});

}

function requestAPI(url, cb){
	return requestUrl(url, function(err, res, body){
		if (!err){
			try {
				libxmljs.parseXml(body);
			} catch (e){
				return cb(false);
			}
			cb(JSON.parse(xml2json.toJson(body)));
		}
	});
}

function requestPage(url, cb){
	return requestUrl(url, function(err, res, body){
		cb(cheerio.load(translator.convert(body).toString(), res));
	}, true);
}

app.get('/', function(req, res){
	if (checkPermission(req.url)){
		res.render('index', {});
	} else {
		res.render('error-403', {});
	}
});

io.on('connection', function(socket){
	socket.on('handshake.client', function(){
		socket.emit('handshake.server')
	});

	socket.on('rating.request', function(param){
		param = param || {};
		var id = param.id || 'validate_error';
		if (!checkInt(id)){
			return socket.emit('rating.response', {status : 'validate_error'});
		}
		requestAPI('http://rating.kinopoisk.ru/' + id + '.xml', function(json){
			if (json){
				json.status = json.rating ? json.rating.kp_rating ? ((!json.rating.imdb_rating) && (json.rating.kp_rating.num_vote === 0)) ? 'not_found' : 'ok' : 'kp_error' : 'kp_error';
			} else {
				json = {status : 'kp_error'};
			}
			socket.emit('rating.response', json);
		}).on('error', function(e){
			socket.emit('rating.response', {status : 'kp_error'});
		});
		requestPage('http://www.kinopoisk.ru/film/' + id + '/', function($){
			socket.emit('film.name.response', $('title').text());
		});

	});
});

http.listen(config.get('server:port') || 8081, config.get('server:host') || '127.0.0.1');
