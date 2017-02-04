'use strict'
var wx =require('../../wx/index')
var Movie =require('../api/movie_index')
var co = require('co');
var util = require('../../libs/util')


exports.guess = co.wrap(function* (ctx, next){
	var wechatApi = wx.getWechat();
	var data = yield wechatApi.fetchAccessToken();
	var access_token = data.access_token;
	var ticketData = yield wechatApi.fetchTicket(access_token);
	var ticket = ticketData.ticket;
	var url = ctx.href;
	var params = util.sign(ticket, url);
	yield ctx.render('/wechat/game', params);
})
exports.find = co.wrap(function* (ctx, next){
	var id = ctx.params.id;	
	var wechatApi = wx.getWechat();
	var data = yield wechatApi.fetchAccessToken();
	var access_token = data.access_token;
	var ticketData = yield wechatApi.fetchTicket(access_token);
	var ticket = ticketData.ticket;
	var url = ctx.href;
	var params = util.sign(ticket, url);
	var movie = yield Movie.searchById(id);
	params.movie = movie;
	yield ctx.render('/wechat/movie', params);
})
