'use strict'
var path = require('path')
var wx = require('./index')
var _ = require('ladash')
var co = require('co')
var wechatApi = wx.getWechat();
exports.reply = co.wrap(function* (next) {
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
		}else if (content === '5'){
			var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'));
			reply = {
				type : 'image',
				mediaId : data.media_id
			}
		}else if (content === '6'){
			var data = yield wechatApi.uploadMaterial('video', path.join(__dirname, '../1.mp4'));
			reply = {
				type : 'video',
				mediaId : data.media_id,
				title : '视频1',
				description: '视频1',
			}
		}else if (content === '7'){
			var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'));
			reply = {
				type : 'music',
				title : '音乐1',
				description: '音乐1',
				musicUrl:'http://link.hhtjim.com/xiami/1770409076.mp3',
				hqMusicUrl:'http://link.hhtjim.com/xiami/1770409076.mp3',
				thumbMediaId: data.media_id
			}
		}else if (content === '8'){
			var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'), {type : 'image'});
			console.log(data.media_id);
			reply = {
				type : 'image',
				mediaId : data.media_id
			}
		}else if (content === '9'){
			var data = yield wechatApi.uploadMaterial('video', path.join(__dirname, '../1.mp4'), {type : 'video', description: {"title":"视频1", "introduction":"视频1"}});
			console.log(data);
			reply = {
				type : 'video',
				mediaId : data.media_id,
				title : '视频1',
				description: '视频1',
			}
		}else if (content === '10'){
			var picData = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'), {});
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
			var tagCheck1 = yield wechatApi.checkTag(message.FromUserName);
			console.log('查看我的标签/n');
			console.log(tagCheck1);
			var tags1 = yield wechatApi.fecthTags();
			console.log('标签列表/n');
			console.log(tags1);

			/*var move1 = yield wechatApi.batchUesrTag(['oe0IEv89v1gEkLfpf9tzZCWv7uNU','oe0IEv6srsMjcEDJCeKHhqlSXPSw'],102);
			console.log('我移到2/n')
			console.log(move1);*/
			//yield wechatApi.deleteTag(101);
			
			/*var tags1 = yield wechatApi.fecthTags();
			console.log('标签列表/n');
			console.log(tags1);

			var move1 = yield wechatApi.batchUesrTag(['oe0IEv6srsMjcEDJCeKHhqlSXPSw'],2);
			console.log('我移到2/n')
			console.log(move1);
			

			/*var updata1 = yield wechatApi.updataTag(101, 'dahai2');
			console.log('更新101/n');
			console.log(updata1);*/
			

			/*var del = yield wechatApi.deleteTag(100);
			console.log('删除100/n');
			console.log(del)*/

			/*var tags2 = yield wechatApi.fecthTags();
			console.log('标签列表/n');
			console.log(tags2);*/
			/*var move1 = yield wechatApi.batchUesrsTag([message.FromUserName], 102);
			console.log('我移到102/n');
			var fecthUesr = yield wechatApi.fecthUesrTag(102);
			console.log('标签列表/n');
			console.log(fecthUesr);*/

			reply = 'Tag done'
		}else if (content === '13'){
			/*var user = yield wechatApi.fecthUsers(message.FromUserName, 'en');
			console.log(user);*/ 
			var openIds = [{
				openid: 'oe0IEv89v1gEkLfpf9tzZCWv7uNU',
				lang: 'zh-CN'
			},
			{
				openid: 'oe0IEv6srsMjcEDJCeKHhqlSXPSw',
				lang: 'zh-CN'
			}]
			var users = yield wechatApi.fecthUsers(openIds);
			console.log(users);

			reply = JSON.stringify(users)
		}else if (content === '14'){
			var users = yield wechatApi.listUsers('oe0IEv6srsMjcEDJCeKHhqlSXPSw');
			console.log(users);

			reply = 'ok'
		}else if (content === '15'){
			var image = {
				media_id :'EZLFu9HSX1xnvfD08kE3NSrE6rs4T--cSiGZerDfhPk'
			}
			var content = {
				content : '您好'
			}
			var msgData = yield wechatApi.sendByGroup('image',image, 102);
			reply = 'yeah'
			console.log(msgData);
		}else if (content === '16'){
			var image = {
				media_id :'EZLFu9HSX1xnvfD08kE3NSrE6rs4T--cSiGZerDfhPk'
			}
			var mpnews = {
				media_id :'EZLFu9HSX1xnvfD08kE3Ne9TpfAEQIRoq1e--1oWMHA'
			}

			var text = {
				content : '蒋明珠，SB'
			}
			var msgData = yield wechatApi.previewMass('text',text, 'oe0IEv6srsMjcEDJCeKHhqlSXPSw');
			//var msgData = yield wechatApi.previewMass('text',text, 'oe0IEv6srsMjcEDJCeKHhqlSXPSw');
			console.log(msgData);
			reply = 'yeah'
		}else if (content === '17'){
			var msgData = yield wechatApi.checkMass('')
		}else if (content === '18'){
			var tempQr = {
				expire_seconds : 400000,
				action_name : 'QR_SCENE',
				action_info : {
					scene : {
						scene_id : 123
					}
				}
			}
			var permQr = {
				action_name : 'QR_LIMIT_SCENE',
				action_info : {
					scene : {
						scene_id : 123
					}
				}
			}
			var permStrQr = {
				action_name : 'QR_LIMIT_STR_SCENE',
				action_info : {
					scene : {
						scene_str : 'abc'
					}
				}
			}
			var qrCode1 = yield wechatApi.createQrcode(tempQr)
			var qrCode2 = yield wechatApi.createQrcode(permQr)
			var qrCode3 = yield wechatApi.createQrcode(permStrQr)
		}else if (content === '19'){
			var longUrl = 'http://www.baidu.com/';
			var shortData = yield wechatApi.shortUrlQrcode(null, longUrl);
			reply = shortData.short_url;
		}else if (content === '20'){
			var semanticData = {
				query: '黑衣人',
				city: '广州',
				category: 'movie',
				uid: message.FromUserName
			} 
			var _semanticData = yield wechatApi.semantic(semanticData);
			console.log(semanticData);
			reply = JSON.stringify(_semanticData);
		}
		this.body = reply
	}

	yield next()
})