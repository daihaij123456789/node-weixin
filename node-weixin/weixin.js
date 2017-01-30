'use strict'
var config = require('./config');
var Wechat = require('./wechat/wechat')
var wechatApi =new Wechat(config.wechat)
var _ =require('ladash')
exports.reply = function* (next) {
	var message = this.weixin;
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
			var data = yield wechatApi.uploadMaterial('video', __dirname + '/1.mp4', {type : 'video', description: {"title":"视频1", "introduction":"视频1"}});
			reply = {
				type : 'video',
				mediaId : data.media_id,
				title : '视频1',
				description: '视频1',
			}
		}else if (content === '10'){
			var picData = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg', {});
			console.log(picData.media_id); 
			var media = {
			articles: [{
					title : '标题10',
					thumb_media_id: picData.media_id,
					author: '蒋海勇',
					digest: '摘要',
					show_cover_pic: 1,
					content: '内容',
					content_source_url: 'http://baidu.com/'
				}]
			}

			data = yield wechatApi.uploadMaterial('news', media, {});

			data = yield wechatApi.fetchMaterial(data.media_id, 'news', {});
			var items = data.news_item;
			var news = [];
			items.forEach(function (item) {
				news.push({
					title : item.title,
					description: item.digest,
					prcUrl: picData.url,
					url: item.url
				})
			})
			reply = news
		}else if (content === '11'){
			var counts = yield wechatApi.countMaterial();
			console.log(JSON.stringify(counts));

			var results = yield [
				wechatApi.batchMaterial({type:'image', offset: 0, count: 10}),
				wechatApi.batchMaterial({type:'video', offset: 0, count: 10}),
				wechatApi.batchMaterial({type:'voice', offset: 0, count: 10}),
				wechatApi.batchMaterial({type:'news', offset: 0, count: 10})
			]
			console.log(JSON.stringify(results));
			reply = '1'
		}else if (content === '12'){
			/*var tag1 = yield wechatApi.createTag('dahai1');
			console.log('新标签/n');
			console.log(tag1);*/

			/*var tags1 = yield wechatApi.fecthTags();
			console.log('标签列表/n');
			console.log(tags1);*/


			var tagCheck1 = yield wechatApi.checkTag(message.FromUserName);
			console.log('查看我的标签/n');
			console.log(tagCheck1);

			/*var updata1 = yield wechatApi.updataTag(101, 'dahai2');
			console.log('更新101/n');
			console.log(updata1);*/
			/*var move1 = yield wechatApi.moveTag(message.FromUserName, 100);
			console.log('移动到100/n');
			console.log(move1);*/

			/*var del = yield wechatApi.deleteTag(100);
			console.log('删除100/n');
			console.log(del)*/

			/*var tags2 = yield wechatApi.fecthTags();
			console.log('标签列表/n');
			console.log(tags2);*/
			/*var move1 = yield wechatApi.batchUesrTag([message.FromUserName], 102);
			console.log('我移到102/n');
			var fecthUesr = yield wechatApi.fecthUesrTag(102);
			console.log('标签列表/n');
			console.log(fecthUesr);*/

			reply = 'Tag done'
		}
		this.body = reply
	}
	yield next
}