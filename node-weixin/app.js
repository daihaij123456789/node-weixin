'use strict'
var Koa=require('koa');
var wechat = require('./wechat/g');
var path=require('path');
var config = require('./config');
var reply = require('./wx/reply');
var wechat_file = path.join(__dirname, './config/wechat.txt')
var app=new Koa();
app.use(wechat(config.wechat, reply.reply))
app.listen(1234);
console.log("listen :1234");