TicTacToe.MainView = Backbone.View.extend({
	template: _.template('\
		<div class="nav">\
			<div class="btn-group">\
				<button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">Создать игру</button>\
				<ul class="dropdown-menu">\
					<li><a href="#" data-action="createGame" data-size="3">3x3</a></li>\
					<li><a href="#" data-action="createGame" data-size="10">10x10</a></li>\
				</ul>\
			</div>\
			<button class="btn btn-primary" data-action="gamesList">Подключиться</button>\
		</div>\
		<div class="game"></div>\
	'),
	events: {
		'click [data-action="createGame"]': 'createGame',
		'click [data-action="gamesList"]': 'gamesList'
	},
	render: function() {
		this.$el.html(this.template());
		return this;
	},
	createGame: function(e) {
		var size = $(e.target).data('size');
		this.trigger('createGame', size);
	},
	gamesList: function() {
		this.trigger('getGamesList');
	}
});