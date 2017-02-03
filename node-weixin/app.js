'use strict'
var Koa=require('koa');
//var wechat = require('./wechat/g');
var path=require('path');
var fs=require('fs');
//var reply = require('./wx/reply');
var menu =require('./wx/menu')
//var wx =require('./wx/index')
var mongoose = require('mongoose');
var router = require('koa-router')();
var game = require('./app/controllers/game');
var wechat = require('./app/controllers/wechat');



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


router.get('/movie', game.movie)
router.get('/wx', wechat.hear)
router.post('/wx', wechat.hear)
app.use(router['routes']());
app.use(router.allowedMethods());
//app.use(wechat(wx.wechatOptions.wechat, reply.reply));
app.listen(1234);
console.log("listen :1234");