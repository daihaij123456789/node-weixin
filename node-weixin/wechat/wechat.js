'use strict'
var Promise = require('bluebird');
var util = require('./util');
var fs = require('fs');
var request = Promise.promisify(require('request'));
var _ =require('lodash')
var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',//access_token
    temporary:{    
        upload: prefix + 'media/upload?'//临时素材
    },
    permanent:{
    upload: prefix + 'material/add_material?', //永久图片与视频   
    uploadNews: prefix + 'material/add_news?',//永久图文 
    uploadNewsPic: prefix +  'media/uploadimg?'//永久图文消息内的图片

    }
}

function Wechat(opts) {
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;
    this.fetchAccessToken();
    
}

Wechat.prototype.isValidAccessToken = function(data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false
    }
    var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());

    if (now < expires_in) {
        return true
    } else {
        return false
    }
}

//获取access_tokens
Wechat.prototype.fetchAccessToken = function() {
    var that = this;
    if (this.access_token && this.expires_in) {
        if (this.isValidAccessToken(this)) {
            return Promise.resolve(this);
        }
    }
    this.getAccessToken()
        .then(function(data) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return that.updateAccessToken();
            }
            if (that.isValidAccessToken(data)) {
                return Promise.resolve(data);
            } else {
                return that.updateAccessToken();
            }
        })
        .then(function(data) {
            that.access_token = data.access_token;
            that.expires_in = data.expires_in;
            that.saveAccessToken(data);
            
            return Promise.resolve(data);
        })
}

//更新access_tokens
Wechat.prototype.updateAccessToken = function() {
    var appID = this.appID;
    var appSecret = this.appSecret;
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;
    return new Promise(function(resolve, reject) {
        request({ url: url, json: true }).then(function(response) {
            var data = response.body;
            var now = (new Date().getTime());
            var expires_in = now + (data.expires_in - 20) * 1000;
            data.expires_in = expires_in;
           	resolve(data)
        })
    })

}

//上传临时素材
Wechat.prototype.uploadMaterial = function(type, material, permanent) {
    var that = this;
    var form = {};
    var uploadUrl = api.temporary.upload;
    if (permanent) {
        uploadUrl = api.permanent.upload;
        _.extend(form, permanent)
    }
    if (type === 'pic') {
        uploadUrl = api.permanent.uploadNewsPic;
    }
    if (type === 'news') {
        uploadUrl = api.permanent.uploadNews;
        form = material
    }else{
        form.media = fs.createReadStream(material)
    }

    var options = {
        method: 'POST',
        url: uploadUrl,
        json: true
    }
    if(type === 'news'){
        options.body = form
    }else{
        options.formData = form
    }
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = uploadUrl + 'access_token=' + data.access_token;
                if (!permanent) {
                    url +=  '&type=' + type;
                }else{
                    form.access_token = data.access_token
                }
                request({ method: 'POST', url: url, formData: form, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Upload Material Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//回复消息与编译模版
Wechat.prototype.reply = function() {
    var content = this.body;
    var message = this.weixin;
    this.status = 200;
    this.type = 'application/xml';
    var xml = util.tpl(content, message);
    this.body = xml;
    //console.log(xml);
}


module.exports = Wechat;
