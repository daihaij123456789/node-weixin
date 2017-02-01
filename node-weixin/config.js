'use strict'
var path = require('path');
var util = require('./libs/util');
var wechat_file = path.join(__dirname,'./config/wechat.txt');
var wechat_ticket_file = path.join(__dirname,'./config/wechat_ticket.txt');

var config = {
	wechat:{
		appID: 'wx9226474d248fd396',
		appSecret: 'e022d368d3010321e9af508dac8c66da',
		token: 'dahai',
		getAccessToken: function () {
			return util.readFileAsync(wechat_file);
		},
		saveAccessToken: function (data) {
			data=JSON.stringify(data);
			return util.writeFileAsync(wechat_file,data);
		},
		getTicket: function () {
			return util.readFileAsync(wechat_ticket_file);
		},
		saveTicket: function (data) {
			data=JSON.stringify(data);
			return util.writeFileAsync(wechat_ticket_file, data);
		}
	}
}
module.exports = config