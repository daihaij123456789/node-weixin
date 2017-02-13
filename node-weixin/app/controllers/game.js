'use strict'
var wx =require('../../wx/index')
var Movie =require('../api/movie_index')
var Music =require('../api/music_index')
var co = require('co');
var moment = require('moment');
var koa_request = require('koa-request')
var util = require('../../libs/util')
var User = require('../models/user/user');
var MovieComment = require('../models/movie/movie_comment'); // 电影评论模型
var MusicComment = require('../models/music/music_comment'); // 音乐评论模型

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
exports.findMovie = co.wrap(function* (ctx, next){
	var code = ctx.query.code;
	var id = ctx.params.id;	
	var openUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid='+wx.wechatOptions.wechat.appID+'&secret='+wx.wechatOptions.wechat.appSecret+'&code='+code+'&grant_type=authorization_code '
	var response = yield koa_request({
		url:openUrl
	})
	var body = JSON.parse(response.body);
	var openid = body.openid;

	var user = yield User.findOne({openid:openid}).exec();
	if (!user) {
		user = new User({
			openid:openid,
			password:'dahai123',
			name:Math.random().toString(36).substr(4)
		})
		yield user.save();
	}
	ctx.session.user = user;
	ctx.state.user = user;
	var wechatApi = wx.getWechat();
	var data = yield wechatApi.fetchAccessToken();
	var access_token = data.access_token;
	var ticketData = yield wechatApi.fetchTicket(access_token);
	var ticket = ticketData.ticket;
	var url = ctx.href;
	var params = util.sign(ticket, url);
	var movie = yield Movie.searchById(id);
	// 在数据库中保存用户回复后会生成一条该评论的_id，服务器查找该_id对应的值返回给客户端
    var comments = yield MovieComment.find({ movie:id })
            .populate('from', 'name')
            .populate('reply.from reply.to', 'name') // 查找评论人和回复人的名字
            .exec()
	params.movie = movie;
	params.comments = comments;
	params.moment = moment;
	yield ctx.render('/wechat/movie', params);
})
exports.findMusic = co.wrap(function* (ctx, next){
	var code = ctx.query.code;
	var id = ctx.params.id;	
	var openUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid='+wx.wechatOptions.wechat.appID+'&secret='+wx.wechatOptions.wechat.appSecret+'&code='+code+'&grant_type=authorization_code '
	var response = yield koa_request({
		url:openUrl
	})
	var body = JSON.parse(response.body);
	var openid = body.openid;

	var user = yield User.findOne({openid:openid}).exec();
	if (!user) {
		user = new User({
			openid:openid,
			password:'dahai123',
			name:Math.random().toString(36).substr(4)
		})
		yield user.save();
	}
	ctx.session.user = user;
	ctx.state.user = user;
	var wechatApi = wx.getWechat();
	var data = yield wechatApi.fetchAccessToken();
	var access_token = data.access_token;
	var ticketData = yield wechatApi.fetchTicket(access_token);
	var ticket = ticketData.ticket;
	var url = ctx.href;
	var params = util.sign(ticket, url);
	var music = yield Music.searchById(id);
	// 在数据库中保存用户回复后会生成一条该评论的_id，服务器查找该_id对应的值返回给客户端
    var comments = yield MusicComment.find({ music:id })
            .populate('from', 'name')
            .populate('reply.from reply.to', 'name') // 查找评论人和回复人的名字
            .exec()
	params.music = music;
	params.comments = comments;
	params.moment = moment;
	yield ctx.render('/wechat/music', params);
})
exports.jumpMovie = co.wrap(function* (ctx, next){
	var movieId = ctx.params.id;
	var redirectUrl = 'http://dahaimovie.tunnel.qydev.com/wechat/movie/' + movieId
	var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+wx.wechatOptions.wechat.appID+'&redirect_uri='+redirectUrl+'&response_type=code&scope=snsapi_base&state='+movieId+'#wechat_redirect';
	ctx.redirect(url);
})
exports.jumpMusic = co.wrap(function* (ctx, next){
	var musicId = ctx.params.id;
	var redirectUrl = 'http://dahaimovie.tunnel.qydev.com/wechat/music/' + musicId
	var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+wx.wechatOptions.wechat.appID+'&redirect_uri='+redirectUrl+'&response_type=code&scope=snsapi_base&state='+musicId+'#wechat_redirect';
	ctx.redirect(url);
})
