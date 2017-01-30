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
        upload: prefix + 'media/upload?',//临时素材上传
        fetch: prefix + 'media/get?'//临时素材获取
    },
    permanent:{
        upload: prefix + 'material/add_material?', //上传永久图片与视频   
        fetch: prefix + 'material/get_material?',//获取永久素材
        del: prefix + 'material/del_material?',//删除永久素材
        update: prefix + 'material/update_news?',//更新永久素材
        count: prefix + 'material/get_materialcount?',//获取永久素材总数
        batch: prefix + 'material/batchget_material?',//获取永久素材列表
        uploadNews: prefix + 'material/add_news?',//上传永久图文 
        uploadNewsPic: prefix +  'media/uploadimg?'//上传永久图文消息内的图片
    },
    tag:{
        create: prefix + 'tags/create?',//创建标签
        fecth: prefix + 'tags/get?',//查询标签
        check: prefix + 'tags/getidlist?',//获取用户身上的标签列表
        updata: prefix + 'tags/update?',//更新标签
        userlist: prefix + 'user/tag/get?',//标签下粉丝列表
        batchtag: prefix + 'tags/members/batchtagging?',//批量标标签
        batchuntag: prefix + 'tags/members/batchuntagging?',//批量取消标签
        del: prefix + 'tags/delete?',//删除标签
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

//上传素材
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
                var options = {
                    method: 'POST',
                    url: url,
                    json: true
                }
                if(type === 'news'){
                    options.body = form
                }else{
                    options.formData = form
                }
                request(options).then(function(response) {
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

//获取素材
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
    var that = this;
    var fetchUrl = api.temporary.fetch;
    if (permanent) {
        fetchUrl = api.permanent.fetch;
    }
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = fetchUrl + 'access_token=' + data.access_token;
                var options = {method: 'POST', url: url, json: true }
                var form = {
                    media_id: mediaId,
                    access_token: data.access_token
                }
                if (permanent) {
                    form.media_id = mediaId;
                    form.access_token = data.access_token;
                    options.body = form

                }else{
                    if (type === 'video') {
                        url = url.relpace('https://', 'http://')
                    }
                    url += '&media_id=' + mediaId;
                }
                if (type === 'news' || type === 'video') {
                    request(options).then(function(response) {
                            var _data = response.body;
                            console.log(JSON.stringify(_data));
                            if (_data) {
                                resolve(_data)
                            } else {
                                throw new Error('Delete Material Fails');
                            }
                        })
                        .catch(function(err) {
                            reject(err)
                        })
                }else{
                        reject(url)
                }
            })
    })
}

//删除永久素材
Wechat.prototype.deleteMaterial = function(mediaId) {
    var that = this;
    var form = {media_id: mediaId};
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId;
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Delete Material Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//更新永久素材
Wechat.prototype.updateMaterial = function(mediaId, news) {
    var that = this;
    var form = {media_id: mediaId};
    _.extend(form, news)
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId;
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Update Material Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取素材总数
Wechat.prototype.countMaterial = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.count + 'access_token=' + data.access_token;
                request({ method: 'GET', url: url, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Count Material Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取素材列表
Wechat.prototype.batchMaterial = function(options) {
    var that = this;
    options.type = options.type|| 'image';
    options.offset = options.offset|| 0;
    options.count = options.count|| 1;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.permanent.batch + 'access_token=' + data.access_token;
                request({ method: 'POST', url: url, body: options, json: true }).then(function(response) {
                        var _data = response.body;
                        
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Batch Material Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//创建标签
Wechat.prototype.createTag = function(name) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.create + 'access_token=' + data.access_token;
                var form = {
                    tag:{
                        name : name
                    }
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        console.log(_data);
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Create Tag Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取标签
Wechat.prototype.fecthTags = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.fecth + 'access_token=' + data.access_token;
                request({ method: 'GET', url: url, json: true }).then(function(response) {
                        var _data = response.body;
                        
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Fecth Tag Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取用户身上的标签列表
Wechat.prototype.checkTag = function(openId) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.check + 'access_token=' + data.access_token;
                var form = {
                        openid : openId
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Check Tag Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//更新标签
Wechat.prototype.updataTag = function(id, name) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.updata + 'access_token=' + data.access_token;
                console.log(url);
                var form = {
                        tag: {
                            id: id,
                            name: name
                        }
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Updata Tag Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//批量关注标签
Wechat.prototype.batchUesrTag = function(openIds, id) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.batchtag + 'access_token=' + data.access_token;
                var form = {
                    openid_list: openIds,
                    tagid: id
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Move Tag Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//批量取消关注标签
Wechat.prototype.batchUntag = function(openIds, id) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.batchuntag + 'access_token=' + data.access_token;
                var form = {
                    openid_list: openIds,
                    tagid: id
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Move Tag Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//删除标签
Wechat.prototype.deleteTag = function(id) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.del + 'access_token=' + data.access_token;
                var form = {
                    tag:{
                        id: id
                    }
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Delete Tag Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取标签下用户列表
Wechat.prototype.fecthUesrTag = function(id, count) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.tag.userlist + 'access_token=' + data.access_token;
                var form = {
                        tagid: id,
                        next_openid: count
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Delete Tag Fails');
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
