var primus = new Primus('http://localhost:3000/', { parser: 'JSON' });
var gamesList = [];
var TicTacToe = {};
var gameView;

$(function() {
	var view = new TicTacToe.MainView();
	$('#viewport').html(view.render().el);
	view.on('getGamesList', function() {
		primus.write({action: 'getGamesList'});
	});
	view.on('createGame', function(size) {
		primus.write({action: 'startNewGame', data: {size: size}});
	});
	primus.on('open', function open() {
		TicTacToe.setStatus('Соединение установленно');
	});
	primus.on('data', function(response) {
		if (response.action) {
			TicTacToe.controller[response.action + 'Action'](response.data);
		}
	});
});
TicTacToe.setStatus = function(status) {
	$('#status').html(status);
}
TicTacToe.showMain = function() {
	var view = new TicTacToe.MainView();
	$('#viewport').html(view.render().el);
	TicTacToe.setStatus('');
}

TicTacToe.controller = {
	gameCreatedAction: function(data) {
		TicTacToe.setStatus('Игра создана. Ждём второго игрока.' + data.name + ' ' + data.size + 'x' + data.size);
		$('#viewport').empty();
	},
	gamesListAction: function(list) {
		var view = new TicTacToe.GamesListView({collection: list});
		$('#viewport').html(view.render().el);
		view.on('joinGame', function(gameId) {
			primus.write({action: 'joinGame', data: {gameId: gameId}});
		});
		view.on('back', TicTacToe.showMain);
	},
	startAction: function(data) {
		gameView = new TicTacToe.GameView(data);
		$('#viewport').html(gameView.render().el);
		gameView.on('turn', function(coords) {
			TicTacToe.setStatus('Ход противника');
			primus.write({action: 'turn', data: coords});
		});
		gameView.on('back', TicTacToe.showMain);
		TicTacToe.setStatus('Игра начата.' + data.name + ' ' + data.size + 'x' + data.size);
	},
	turnAction: function(data) {
		TicTacToe.setStatus('Ваш ход');
		gameView.giveTurn(data);
	},
	winAction: function(data) {
		gameView.end(true);
		if (data && data.message) {
			TicTacToe.setStatus('Поздравляю с победой! ' + data.message);
		} else {
			TicTacToe.setStatus('Поздравляю с победой! ;)');
		}
	},
	loseAction: function() {
		gameView.end(false);
		TicTacToe.setStatus('Вы проиграли :(');
	},
	peaceAction: function() {
		gameView.end(true);
		TicTacToe.setStatus('Победила дружба! ;)');
	},
	errorAction: function(error) {
		TicTacToe.setStatus(error);
	}
}