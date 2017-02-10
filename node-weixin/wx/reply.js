'use strict'
var path = require('path')
var wx = require('./index')
var _ = require('ladash')
var co = require('co')
var Movie = require('../app/api/movie_index')
var wechatApi = wx.getWechat();
exports.reply = co.wrap(function* (next) {
	var message = this.weixin;
	if(message.MsgType==='event'){
		if (message.Event==='subscribe') {
			this.body = '欢迎订阅大海休闲\n' +
			'回复1~3,测试文字回复\n' +
			'回复4,测试图文回复\n' +
			'回复电影首页,进入电影首页\n' +
			'回复音乐首页,进入音乐首页\n' +
			'回复登陆,进入微信登陆页面\n' +
			'回复游戏,进入微信游戏页面\n' +
			'回复电影名字,查询电影信息\n' +
			'回复音乐名字,查询音乐信息\n' +
			'回复语音,使用语音查询信息\n' +
			'点击 <a href="http://dahaimovie.tunnel.qydev.com/voiceMovie">语音查电影</a>'+
			'点击 <a href="http://dahaimovie.tunnel.qydev.com/voiceMusic">语音查音乐</a>'	
		}else if(message.Event === 'unsubscribe'){
			this.body ='';
			console.log('取消');
		}else if(message.Event === 'LOCTION'){
			this.body = '位置是' + message.latitude  + '/' + message.Longitude + '-' + message.Precisoin
		}else if(message.Event === 'CLICK'){
			this.body = '点击菜单' + message.EventKey
		}else if(message.Event === 'SCAN'){
			console.log('关注后扫描' +  message.EventKey + ' ' +message.Ticket); 
			this.body = '扫一下'
		}else if(message.Event === 'VIEW'){
			this.body = '点击菜单链接' + message.EventKey;
		}else if(message.Event === 'scancode_push'){
			console.log(message.ScanCodeInfo.ScanType);
			console.log(message.ScanCodeInfo.ScanResult);
			this.body = '扫码推事件' + message.EventKey;
		}else if(message.Event === 'scancode_waitmsg'){
			console.log(message.ScanCodeInfo.ScanType);
			console.log(message.ScanCodeInfo.ScanResult);
			this.body = '扫码带提示' + message.EventKey;
		}else if(message.Event === 'pic_sysphoto'){
			console.log(message.SendPicsInfo.Count);
			console.log(message.SendPicsInfo.PicList);
			this.body = '系统拍照发图' + message.EventKey;
		}else if(message.Event === 'pic_photo_or_album'){
			console.log(message.SendPicsInfo.Count);
			console.log(message.SendPicsInfo.PicList);
			this.body = '拍照或者相册发图' + message.EventKey;
		}else if(message.Event === 'pic_weixin'){
			console.log(message.SendPicsInfo.Count);
			console.log(message.SendPicsInfo.PicList);
			this.body = '微信相册发图' + message.EventKey;
		}else if(message.Event === 'location_select'){
			console.log(message.SendLocationInfo.Location_X);
			console.log(message.SendLocationInfo.Location_Y);
			console.log(message.SendLocationInfo.Scale);
			console.log(message.SendLocationInfo.Poiname);
			this.body = '发送位置' + message.EventKey;
		}
	}else if(message.MsgType === 'text'){
		var content = message.Content;
		var reply = '额，你说的是' + message.Content + '太复杂呢';
		if (content === '1') {
			reply = '菜单导航'
		}else if (content === '2') {
			reply = '菜单导航2'
		}else if (content === '3') {
			reply = '菜单导航3'
		}else if (content === '4') {
			reply = [{
				title : '标题1',
				description: '描述1',
				prcUrl:'http://t.dyxz.la/upload/img/201701/poster_20170107_8447271_b.jpg',
				url: 'http://baidu.com/'
			}]
		}else {
			var movies = yield Movie.searchByName(content);
			if (!movies || movies.length === 0) {
				movies = yield Movie.searchByDouban(content);
			}
			if (movies && movies.length >0) {
				reply = [];
				
				movies.forEach(function(movie, index){
					if (index < 5) {
						reply.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: 'http://dahaimovie.tunnel.qydev.com/wechat/movie/' + movie._id
						});
					}
				})
			}else{ 
				reply = '没有查询到与' + content + '相关的电影，请换一个名字试试！！！'
			}
		}
		this.body = reply
	}else if(message.MsgType === 'voice'){
		var voiceText = message.Recognition
		var movies = yield Movie.searchByName(voiceText);
			if (!movies || movies.length === 0) {
				movies = yield Movie.searchByDouban(voiceText);
			}
			if (movies && movies.length >0) {
				reply = [];
				movies.forEach(function(movie, index){
					if (index < 5) {
						reply.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: 'http://dahaimovie.tunnel.qydev.com/movie/' + movie._id
						});
					}
				})
			}else{ 
				reply = '没有查询到你说的相关的电影，请换一个名字或者再说一遍试试！！！'
			}
		this.body = reply
	}

	yield next()
})