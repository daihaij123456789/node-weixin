'use strict'
var config = require('./config');
var Wechat = require('./wechat/wechat')
var wechatApi =new Wechat(config.wechat)
var _ =require('ladash')
exports.reply = function* (next) {
	var message = this.weixin;
	
	//console.log(message);
	if(message.MsgType==='event'){
		if (message.Event==='subscribe') {
			this.body = '欢迎订阅\r\n'
			if (message.EventKey) {
				console.log('二维码' + message.EventKey + ' ' +message.Ticket);
			}
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
		}else if (content === '5'){
			var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg');
			reply = {
				type : 'image',
				mediaId : data.media_id
			}
		}else if (content === '6'){
			var data = yield wechatApi.uploadMaterial('video', __dirname + '/1.mp4');
			reply = {
				type : 'video',
				mediaId : data.media_id,
				title : '视频1',
				description: '视频1',
			}
		}else if (content === '7'){
			var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg');
			console.log(data.media_id);
			reply = {
				type : 'music',
				title : '音乐1',
				description: '音乐1',
				musicUrl:'http://link.hhtjim.com/xiami/1770409076.mp3',
				hqMusicUrl:'http://link.hhtjim.com/xiami/1770409076.mp3',
				thumbMediaId: data.media_id
			}
		}else if (content === '8'){
			var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg', {type : 'image'});
			reply = {
				type : 'image',
				mediaId : data.media_id
			}
		}else if (content === '9'){
			var data = yield wechatApi.uploadMaterial('video', __dirname + '/2.jpg', {type : 'video', description: {"title":"视频1", "introduction":"视频1"}});
			console.log(data);
			reply = {
				type : 'video',
				mediaId : data.media_id,
				title : '视频1',
				description: '视频1',
			}
		}
		this.body = reply
	}
	yield next
}