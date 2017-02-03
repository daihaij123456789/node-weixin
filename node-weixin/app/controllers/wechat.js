'use strict'
var wechat = require('../../wechat/g');
var reply = require('../../wx/reply');
var wx =require('../../wx/index');
var co = require('co');

exports.hear = co.wrap(function* (ctx, next) {
	ctx.middle = wechat(wx.wechatOptions.wechat, reply.reply);
		yield ctx.middle(next)
})