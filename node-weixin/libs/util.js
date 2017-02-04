'use strict'
var fs=require('fs');
var Promise=require('bluebird');
var crypto = require('crypto');
exports.readFileAsync=function (fpath,encoding) {
	return new Promise(function(resolve,reject){
		fs.readFile(fpath,encoding,function (err,content) {
			if (err) reject(err)
			else resolve(content)
		});

	})
}

exports.writeFileAsync=function (fpath,content) {
	return new Promise(function(resolve,reject){
		fs.writeFile(fpath,content,function (err) {
			if (err) reject(err)
			else resolve()
		});

	})
}

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
exports.sign = function (ticket, url) {
	var noncestr = createNonceStr();
	var timestamp = createTimesTamp();
	var signature = _sign(noncestr, ticket, timestamp, url);
	return {
		noncestr: noncestr,
		timestamp: timestamp,
		signature: signature
	}
}
