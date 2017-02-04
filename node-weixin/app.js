'use strict'
var Koa=require('koa');
var path=require('path');
var fs=require('fs');
var menu =require('./wx/menu');
var mongoose = require('mongoose');
var router = require('koa-router')();
var game = require('./app/controllers/game');
var wechat = require('./app/controllers/wechat');
var views = require('koa-views')
var jade = require('jade')
var koa_static = require('koa-static')


/*var wechatApi = wx.getWechat();
wechatApi.deleteMenu().then(function () {
	return wechatApi.createMenu(menu)
})
.then(function (msg) {
		console.log(msg);
})*/

var dbUrl='mongodb://localhost/movie';
mongoose.connect(dbUrl);
//modle loading
var models_path = __dirname+'/app/models';
var walk = function (path) {
  fs
    .readdirSync(path)
    .forEach(function (file) {
      var newPath = path + '/' + file;
      var stat = fs.statSync(newPath);
      if (stat.isFile) {
        if (/(.*)\.(js|coffee)/.test(file)) {
          require(newPath)
        }
      }else if (stat.isDirectory) {
        walk(newPath)
      }
    })
}
walk(models_path);

var app=new Koa();
app.use(koa_static(__dirname + '/public'));
app.use(views(__dirname + '/views', { extension: 'jade' }))
router.get('/voiceMovie', game.guess)
router.get('/movie/:id', game.find)
router.get('/wx', wechat.hear)
router.post('/wx', wechat.hear)
app.use(router['routes']());
app.use(router.allowedMethods());
app.listen(1234);
console.log("listen :1234");