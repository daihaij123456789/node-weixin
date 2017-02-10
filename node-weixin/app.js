'use strict'
var Koa=require('koa');
var path=require('path');
var session = require('koa-session');
//var session = require('koa-generic-session');
//var redisStore = require('koa-redis');
var logger = require('koa-logger');
var bodyParser = require('koa-bodyparser');
var koaBody = require('koa-body');
var convert = require('koa-convert');
var multer = require('koa-multer');
//var wx =require('./wx/index');
var mongoose = require('mongoose');
var router = require('koa-router')();
var views = require('koa-views');
var jade = require('jade');
var koa_static = require('koa-static');
var User = require('./app/models/movie/movie');
var co = require('co');
/*var wechatApi = wx.getWechat();
wechatApi.deleteMenu().then(function () {
	return wechatApi.createMenu(menu)
})
.then(function (msg) {
		console.log(msg);
})*/

var dbUrl='mongodb://localhost/movie';
mongoose.connect(dbUrl);

var app = new Koa();

app.use(views(__dirname + '/app/views', { extension: 'jade' }))
app.use(koa_static(__dirname + '/public'));
app.keys = ['movie'];
app.use(convert(session(app)));
app.use(co.wrap(koaBody({ multipart: true,formidable:{uploadDir: __dirname}})));
app.use(convert(bodyParser()));
app.use(convert(logger()));
app.use(router['routes']());
app.use(router.allowedMethods());
require('./config/routes')(router)

app.listen(1234);
console.log("listen :1234");