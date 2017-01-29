'use strict'
var xml2js=require('xml2js');
var Promise=require('bluebird');
var tpl = require('./tpl')

exports.parseXMLAsync=function (xml) {
	return new Promise(function (resolve,reject) {
		xml2js.parseString(xml,{trim:true},function (err,content) {
			if (err) reject(err)
			else resolve(content)
		})
	})
}
function fromatMessage(result) {
	var message={};
	if (typeof result==='object') {
		var keys=Object.keys(result);
		for (var i = 0,k =keys.length; i < k; i++) {
			var item=result[keys[i]];
			var key=keys[i];
			if (!(item instanceof Array)||item.length === 0){
           		continue;
			}

			if (item.length === 1) {
				var val=item[0];
				if (typeof val==='object') {
					message[key]=fromatMessage(val);
				}else{
					message[key]=(val || '').trim();
				}
			}else{
				message[key]=[];
				for (var j = 0,k =item.length;j<K; j++) {
					message[key].push(fromatMessage(item[j]))
				}
			}
		}
	}
	return message;
}
exports.fromatMessage=fromatMessage;
exports.tpl= function (content, message) {
	var info = {};
	var type = 'text';
	var fromUserName = message.FromUserName;
	var toUserName = message.ToUserName;
	if (Array.isArray(content) ){
		type = 'news';
	}
	type = content.type || type;

	info.content = content;
	info.createTime = new Date().getTime();
	info.msgType = type;
	info.toUserName = fromUserName;
	info.fromUserName = toUserName;
	return tpl.compiled(info)
};
