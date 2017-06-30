'use strict'
var path = require('path')
var _ = require('ladash')
var co = require('co')
var Movie = require('../app/api/movie_index')
var Music= require('../app/api/music_index')
var help = '欢迎订阅大海休闲\n' +
			'回复1,进入电影首页\n' +
			'回复2,进入音乐首页\n' +
			'回复1+电影名字(如1功夫),查询电影信息\n' +
			'回复2+音乐名字(如2包容),查询音乐信息\n' +
			'回复语音,使用语音查询信息\n' +
			'点击 <a href="http://www.xuankuangren.com:3000/voiceMovie">语音查电影</a>'+
			'点击 <a href="http://www.xuankuangren.com:3000/voiceMusic">语音查音乐</a>';
exports.reply = co.wrap(function* (next) {
	var message = this.weixin;
	if(message.MsgType==='event'){
		if (message.Event==='subscribe') {
			this.body = help;
		}else if(message.Event === 'unsubscribe'){
			this.body ='';
			console.log('取消');
		}else if(message.Event === 'LOCTION'){
			this.body = '位置是' + message.latitude  + '/' + message.Longitude + '-' + message.Precisoin
		}else if(message.Event === 'CLICK'){
			var news = [];
			if(message.EventKey === 'movie_hot'){
				let movies = yield Movie.findHotMovies(-1,6);
				movies.forEach(function(movie){
					news.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMovie/' + movie._id
						});
				})
			}else if(message.EventKey === 'movie_cold'){
				let movies = yield Movie.findHotMovies(1,6);
				movies.forEach(function(movie){
					news.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMovie/' + movie._id
						});
				})
			}else if(message.EventKey === 'movie_action'){
				let cat = yield Movie.findMoviesByCate('正在上映');
				console.log(cat.movies);
				cat.movies.forEach(function(movie, index){
					if(index<6){
						news.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMovie/' + movie._id
						});
					}
					
				})
			}else if(message.EventKey === 'movie_car'){
				let cat = yield Movie.findMoviesByCate('即将上映');
				cat.movies.forEach(function(movie,index){
					if(index<6){
						news.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMovie/' + movie._id
						});
					}
				})
			}else if(message.EventKey === 'movie_k'){
				let cat = yield Movie.findMoviesByCate('本周口碑榜');
				cat.movies.forEach(function(movie,index){
					if(index<6){
						news.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMovie/' + movie._id
						});
					}
				})
			}else if(message.EventKey === 'music_hot'){
				let musics = yield Music.findHotMusics(-1,6);
				musics.forEach(function(muisc,index){
						news.push({
							title: muisc.title,
							description: muisc.singer,
							picUrl: muisc.image,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMusic/' + muisc._id
						});
				})
			}else if(message.EventKey === 'music_cold'){
				let musics = yield Music.findHotMusics(1,6);
				musics.forEach(function(muisc,index){
						news.push({
							title: muisc.title,
							description: muisc.singer,
							picUrl: muisc.image,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMusic/' + muisc._id
						});
				})
			}else if(message.EventKey === 'music_b'){
				let cat = yield Music.findMusicsByCate('编辑推荐');
				cat.musics.forEach(function(muisc,index){
					if(index<6){
						news.push({
							title: muisc.title,
							description: muisc.singer,
							picUrl: muisc.image,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMusic/' + muisc._id
						});
					}
				})
			}else if(message.EventKey === 'music_car'){
				let cat = yield Music.findMusicsByCate('不灭的经典');
				cat.musics.forEach(function(muisc,index){
					if(index<6){
						news.push({
							title: muisc.title,
							description: muisc.singer,
							picUrl: muisc.image,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMusic/' + muisc._id
						});
					}
				})
			}else if(message.EventKey === 'music_duo'){
				let cat = yield Music.findMusicsByCate('豆瓣音乐250');
				cat.musics.forEach(function(muisc,index){
					if(index<6){
						news.push({
							title: muisc.title,
							description: muisc.singer,
							picUrl: muisc.image,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMusic/' + muisc._id
						});
					}
				})
			}else if(message.EventKey === 'help'){
				news = help
			}
			this.body = news;
		}
	}else if(message.MsgType === 'text'){
		var content = message.Content;
		var reply = '额，你说的是' + message.Content + '太复杂呢';
		if (content === '1') {
			reply = [{
				title : '电影首页',
				description: '点击进入网站电影首页',
				prcUrl:path.join(__dirname, '../public/images/movie/movieLogo.png'),
				url: 'http://www.xuankuangren.com:3000/'
			}]
		}else if (content === '2') {
			reply = [{
				title : '音乐首页',
				description: '点击进入网站音乐首页',
				prcUrl:path.join(__dirname, '../public/images/music/musicLogo.png'),
				url: 'http://www.xuankuangren.com:3000/musicIndex'
			}]
		}else {
			if(content.slice(0, 1) === '1'){
				var contents = content.slice(1)
				var movies = yield Movie.searchByName(contents);
				if (!movies || movies.length === 0) {
					movies = yield Movie.searchByDouban(contents);
				}
				if (movies && movies.length >0) {
					reply = [];
					
					movies.forEach(function(movie, index){
						if (index < 6) {
							reply.push({
								title: movie.title,
								description: movie.title,
								picUrl: movie.poster,
								url: 'http://www.xuankuangren.com:3000/wechat/jumpMovie/' + movie._id
							});
						}
					})
				}else{ 
					reply = '没有查询到与' + content + '相关的电影，请换一个名字试试！！！'
				}
			}else if(content.slice(0, 1) === '2'){
				var contents = content.slice(1)
				var musics = yield Music.searchByName(contents);
				if (!musics || musics.length === 0) {
					musics = yield Music.searchByDouban(contents);
				}
				if (musics && musics.length >0) {
					reply = [];
					
					musics.forEach(function(music, index){
						if (index < 6) {
							reply.push({
								title: music.title,
								description: music.singer,
								picUrl: music.image,
								url: 'http://www.xuankuangren.com:3000/wechat/jumpMusic/' + music._id
							});
						}
					})
				}else{ 
					reply = '没有查询到与' + content + '相关的电影，请换一个名字试试！！！'
				}
			}
		}
		this.body = reply
	}else if(message.MsgType === 'voice'){
		var voiceText = message.Recognition
		var movies = yield Movie.searchByName(voiceText);
		var musics = yield Music.searchByName(voiceText);
			if (!movies || movies.length === 0) {
				movies = yield Movie.searchByDouban(voiceText);
			}
			if (!musics || musics.length === 0) {
				musics = yield Music.searchByDouban(voiceText);
			}
			if (movies && movies.length >0 || musics && musics.length >0) {
				reply = [];
				movies.forEach(function(movie, index){
					if (index < 3) {
						reply.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMovie/' + movie._id
						});
					}
				})
				musics.forEach(function(music, index){
					if (index < 3) {
						reply.push({
							title: music.title,
							description: music.singer,
							picUrl: music.image,
							url: 'http://www.xuankuangren.com:3000/wechat/jumpMusic/' + music._id
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