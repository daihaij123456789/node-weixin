'use strict'
var Koa=require('koa');
var wechat = require('./wechat/g');
var path=require('path');
var config = require('./config');
var reply = require('./wx/reply');
var crypto = require('crypto');
var Wechat = require('./wechat/wechat');
var ejs = require('ejs');
var heredoc = require('heredoc');
var app=new Koa();

var tpl = heredoc(function () {
	/*
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1">
			<title>搜电影</title>
		</head>
		<body>
			<h1>点击录音，开始翻译</h1>
			<p id="title"></p>
			<p id="directors"></p>
			<p id="year"></p>
			<div id="poster"></div>
			<script src="http://zeptojs.com/zepto-docs.min.js"></script>
			<script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>
			<script>
				wx.config({
				    debug: false, 
				    appId: 'wx9226474d248fd396', 
				    timestamp: '<%=timestamp%>', 
				    nonceStr: '<%=noncestr%>', 
				    signature: '<%=signature%>',
				    jsApiList: ['startRecord','stopRecord','onVoiceRecordEnd','translateVoice','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','previewImages']
				});
				wx.ready(function(){
					wx.checkJsApi({
					    jsApiList: ['onVoiceRecordEnd'],
					    success: function(res) {
					    	console.log(res)
					    }
					});


					var shareContent = {
					    title: '搜搜', 
					    desc: '我搜出来了', 
					    link: 'http://baidu.com/', 
					    imgUrl: '', 
					    type: 'link', 
					    dataUrl: '', 
					    success: function() { 
					        window.alert('分享成功')
					    },
					    cancel: function() { 
					        window.alert('取消分享')
						}
					}
					var slides;
					wx.onMenuShareAppMessage(shareContent);
					
					var isRecording = false;
					$('#poster').on('tap', function() {
						console.log(slides)
						wx.previewImage(slides);
					})
					$('h1').on('tap', function() {
						if(!isRecording){
							isRecording = true
							wx.startRecord({
								cancel : function() {
									window.alert('你点击取消，不搜索呢')	
								}
							});
							return 
						}
						isRecording = false
						wx.stopRecord({
						    success: function (res) {
						        var localId = res.localId;
								wx.translateVoice({
								   localId: localId, 
								    isShowProgressTips: 1, 
								    success: function (res) {
								    	var reslut = res.translateResult;
								    	$.ajax({
									        url: 'http://api.douban.com/v2/movie/search?q=' + reslut,
									        type: 'get',
									        dataType: 'jsonp',
									        jsonp: 'callback',
									        success: function(data) {
									        	var subjects = data.subjects[0]
												$('#title').html(subjects.title);  
												$('#directors').html(subjects.directors[0].name);  
												$('#year').html(subjects.year); 
												$('#poster').html('<img src="'+subjects.images.large+'"></img>');
												shareContent = {				
												    title: subjects.title, 
												    desc: '我搜出来了' + subjects.title, 
												    link: 'http://baidu.com/', 
												    imgUrl: subjects.images.large,
												    type: 'link', 
    												dataUrl: '', 
												    success: function() { 
												        window.alert('分享成功,yeah!!!!')
												    },
												    cancel: function() { 
												        window.alert('取消分享,no!!!!')
					    							}
												}

												slides = {
												    current: subjects.images.large, 
												    urls: [subjects.images.large] 
												}

												data.subjects.forEach(function(item, index) {
													if(index < 5){
														slides.urls.push(item.images.large)
													}
												})
												
												wx.onMenuShareAppMessage(shareContent);  
									        }
									      }) 
								    }
								});
						    }
						});
					})
				});
		</script>
		</body>
		</html>
	*/
})
var createNonceStr = function () {
	return Math.random().toString(36).substr(2, 15);
}
var createTimesTamp = function () {
	return parseInt(new Date().getTime()/1000, 10) + '';
}
//字典排序算法
var _sign = function (noncestr, ticket, timestamp, url) {
	var params = [
		'noncestr=' + noncestr,
		'jsapi_ticket=' + ticket,
		'timestamp=' + timestamp,
		'url=' + url
	];
	var str = params.sort().join('&');
	var shasum = crypto.createHash('sha1');
	shasum.update(str);
	return shasum.digest('hex')
}
//签名算法
function sign(ticket, url) {
	var noncestr = createNonceStr();
	var timestamp = createTimesTamp();
	var signature = _sign(noncestr, ticket, timestamp, url);
	return {
		noncestr: noncestr,
		timestamp: timestamp,
		signature: signature
	}
}
app.use(function* (next) {
	if (this.url.indexOf('/movie') > -1	) {
		var wechatApi =new Wechat(config.wechat);
		var data = yield wechatApi.fetchAccessToken();
		var access_token = data.access_token;
		var ticketData = yield wechatApi.fetchTicket(access_token);
		var ticket = ticketData.ticket;
		var url = this.href;
		var params = sign(ticket, url);
		this.body = ejs.render(tpl, params);
		return next
	}
	yield next
})



app.use(wechat(config.wechat, reply.reply))

app.listen(1234);
console.log("listen :1234");