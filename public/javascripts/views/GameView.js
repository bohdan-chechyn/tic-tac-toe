TicTacToe.GameView = Backbone.View.extend({
	template: _.template('\
		<a href="#" class="btn" style="display:none" data-role="back">Назад</a>\
		<div class="game">Игра</div>\
		<table id="board"></table>\
	'),
	events: {
		'click [data-role="back"]': 'back',
		'click td': 'makeTurn'
	},
	initialize: function(options) {
		this.options = options;
		this.gameEnded = false;
	},
	render: function() {
		this.$el.html(this.template());
		var table = this.$('#board').empty();
		var size = this.options.size;
		for(var i = 0; i < size; i++) {
			var tr = $('<tr/>');
			for(var j = 0; j < size; j++) {
				tr.append($('<td/>').attr('id', (j) + 'x' + i).html(' '));
			}
			table.append(tr);
		}
		return this;
	},
	end: function(win) {
		this.gameEnded = true;
		this.$el.addClass('gameEnded' + (win?'Win':'Lose'));
		this.$('[data-role="back"]').show();
	},
	makeTurn: function(e) {
		if (this.gameEnded) {
			return TicTacToe.setStatus('Игра закончена');
		}
		if (!this.myTurn) {
			return TicTacToe.setStatus('Сейчас очередь хода другого игрока');
		}
		var cell = $(e.target);
		if (cell.html() !== ' ') {
			return TicTacToe.setStatus('Эта клетка уже занята');
		}
		var coords = e.target.id.split('x');
		cell.removeClass('tmp-signed');
		cell.html(this.options.sign);
		this.trigger('turn', {x: coords[0], y: coords[1], gameId: this.options.id});
		this.myTurn = false;
		this.$el.removeClass('myTurn');
	},
	giveTurn: function(turnData) {
		if (turnData && turnData.sign) {
			this.$('#' + turnData.x + 'x' + turnData.y).html(turnData.sign);
		}
		this.myTurn = true;
		this.$el.addClass('myTurn');
	},
	back: function() {
		this.trigger('back');
	}
});