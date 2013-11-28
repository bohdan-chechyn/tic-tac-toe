TicTacToe.GamesListView = Backbone.View.extend({
	template: _.template('\
	<a href="#" class="btn" data-role="back">Назад</a>\
	<% for (var i = 0, l = collection.length; i < l; i++) { %>\
	<div class="row">\
		<div class="col-md-2"><%= collection[i].name %> - <%= collection[i].size %>x<%= collection[i].size %></div>\
		<div class="col-md-1"><a href="#" class="btn btn-primary" data-role="join" data-id="<%= collection[i].id %>">присоедениться</a></div>\
	</div>\
	<% } %>\
	'),
	events: {
		'click [data-role="back"]': 'back',
		'click [data-role="join"]': 'join'
	},
	render: function() {
		this.$el.html(this.template({collection: this.collection}));
		return this;
	},
	join: function(e) {
		var gameId = $(e.target).data('id');
		this.trigger('joinGame', gameId);
	},
	back: function() {
		this.trigger('back');
	}
});