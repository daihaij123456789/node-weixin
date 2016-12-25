'use strict'
var Koa=require('koa');
var path=require('path');
var wechat=require('./wechat/g');
var util=require('./libs/util');
var wechat_file=path.join(__dirname,'./config/wechat.txt');

var config={
	wechat:{
		appID:'wx9226474d248fd396',
		appSecret:'e022d368d3010321e9af508dac8c66da',
		token:'dahai',
		getAccessToken:function () {
			return util.readFileAsync(wechat_file);
		},
		saveAccessToken:function (data) {
			data=JSON.stringify(data);
			return util.writeFileAsync(wechat_file,data);
		}
	}
}
var app=new Koa();
app.use(wechat(config.wechat))
app.listen(1234);
console.log("listen :1234");