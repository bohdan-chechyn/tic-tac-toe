var _ = require('underscore');

module.exports = function(primus) {
	var games = {};
	var plaingUsers = {};

	return {
		getGamesListAction: function(spark) {
			var list = [];
			for (var gameId in games) {
				if (games[gameId].isOpen()) {
					list.push({id: gameId, name: games[gameId].getName(), size: games[gameId].getSize()});
				}
			}
			spark.write({action: 'gamesList', data: list});
		},
		startNewGameAction: function(spark, options) {
			if (games.length === Game.GAMES_COUNT_LIMIT) {
				return spark.write({action: 'error', data: 'Достугнут лимит количества одновременных игр'});
			}
			var gameId = options.id = spark.id;
			var game = new Game(options);
			game.addUser(spark.id);
			games[gameId] = game;
			spark.write({action: 'gameCreated', data: {id: gameId, name: game.getName(), size: game.getSize()}});
		},
		joinGameAction: function(spark, data) {
			games[data.gameId].addUser(spark.id);
			var startOptions = games[data.gameId].start();
			for (var userId in startOptions) {
				primus.connections[userId].write({action: 'start', data: startOptions[userId]});
			}
			primus.connections[games[data.gameId].getCurrentTurnUser()].write({action: 'turn', data: {}});
		},
		turnAction: function(spark, data) {
			var game = games[data.gameId];
			var result = game.turn(spark.id, data.x, data.y);
			if (result.end.winner) {
				primus.connections[game.getWinner()].write({action: 'win'});
				primus.connections[game.getLoser()].write({action: 'lose'});
			} else if(result.end.peace) {
				var users = game.getUsers();
				for (var i = 0, l = users.length; i < l; i++) {
					primus.connections[users[i]].write({action: 'peace'});
				}
			} else {
				primus.connections[game.getCurrentTurnUser()].write({action: 'turn', data: result.turn});
			}
		},
		disconnectAction: function(spark) {
			for (var gameId in games) {
				if (games[gameId].hasUser(spark.id)) {
					games[gameId].live(spark.id);
					primus.connections[games[gameId].getCurrentTurnUser()].write({action: 'win', data: {message: 'Противник бежал'}});
					delete games[gameId];
				}
			}
		}
	}
};

var Game = function createGame(options) {
	var currentUser;
	var users = {};
	var signs = ['x', 'o'];
	var field = [];
	var size = options&&options.size?options.size:3;
	var lineLength = size === 3?3:5;
	var name = names.shift();
	var id = options.id;
	var result = {};
	for (var i = 0; i < size; i++) {
		field[i] = [];
		for (var j = 0; j < size; j++) {
			field[i][j] = null;
		}
	}
	this.addUser = function(user) {
		users[user] = {sign: signs.shift()};
		if (!currentUser) {
			currentUser = user;
		}
	}

	this.start = function() {
		var startOptions = {};
		for (var userId in users) {
			startOptions[userId] = {name: name, size: size, sign: users[userId].sign, id: id};
		}
		return startOptions;
	}

	this.turn = function(user, x, y) {
		if (field[x][y] !== null) {
			return {error: 'Эта клетка уже занята'};
		}
		if (user != this.getCurrentTurnUser()){
			return {error: 'Сейчас очердь другого игрока делать ход'};
		}

		field[x][y] = users[user].sign;
		currentUser = _.without(_.keys(users), currentUser).pop();
		return {turn: {x: x, y: y, sign: users[user].sign}, end: checkGameEnd()};
	}

	this.isOpen = function() {
		return signs.length > 0;
	}

	this.getCurrentTurnUser = function() {
		return currentUser;
	}

	this.getSize = function() {
		return size;
	}
	this.getName = function() {
		return name;
	}

	this.hasUser = function(userId) {
		return users[userId] != undefined;
	}

	this.live = function(userId) {
		delete users[userId];
		currentUser = _.without(_.keys(users), userId).pop();
		this.end();
	}

	this.getWinner = function() {
		for (var userId in users)
			if (users[userId].sign == result.winner)
				return userId;
	}

	this.getLoser = function() {
		for (var userId in users)
			if (users[userId].sign != result.winner)
				return userId;
	}

	this.getUsers = function() {
		return _.keys(users);
	}

	this.end = function() {
		names.push(name);
	}

	function checkGameEnd() {
		var row = '';
		var freeCells = 0;
		// check |
		for (var i = 0; i < size; i++) {
			row = field[i].join('');
			result = checkRow(row);
			if (result.winner) {
				return result;
			}
		}
		// check _
		for (var i = 0; i < size; i++) {
			row = '';
			for (var j = 0; j < size; j++) {
				if (field[j][i] !== null) {
					row += field[j][i];
				} else {
					freeCells++;
				}
			}
			result = checkRow(row);
			if (result.winner) {
				return result;
			}
		}

		// check \
		for (var i = 0; i <= (size-lineLength); i++) {
			row = '';
			for (var j = 0; j < size; j++) {
				if (field[j][j] !== null)
					row += field[j][j];
			}
			result = checkRow(row);
			if (result.winner) {
				return result;
			}
		}
		// check /

		for (var i = lineLength; i <= size; i++) {
			row = '';
			for (var j = 0; j < size; j++) {
				if (field[j][size-j-1] !== null)
					row += field[j][size-j-1];
			}
			result = checkRow(row);
			if (result.winner) {
				return result;
			}
		}

		if (freeCells === 0) {
			return {peace: true};
		}
		return result;
	}
	function checkRow(row) {
		var result = {};
		if (row.indexOf(Array(lineLength + 1).join('x')) > -1) {
			result.winner = 'x';
		}
		if (row.indexOf(Array(lineLength + 1).join('o')) > -1) {
			result.winner = 'o';
		}
		return result;
	}
}
Game.GAMES_COUNT_LIMIT = 10;
var names = ['Татуин','Кашиик',  'Кореллия', 'Корускант', 'Дагоба', 'Дантуин', 'Эндор', 'Набу', 'Хот', 'Кашиик', 'Беспин'];