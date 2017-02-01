'use strict'
var Promise = require('bluebird');
var util = require('./util');
var fs = require('fs');
var request = Promise.promisify(require('request'));
var _ =require('lodash')
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';
var semanticUrl = 'https://api.weixin.qq.com/semantic/semproxy/search?';
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',//access_token
    semanticUrl: semanticUrl,
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
        del: prefix + 'tags/delete?'//删除标签
    },
    user:{
        remark: prefix + 'user/info/updateremark?',//用户备注
        fecth: prefix + 'user/info?',//获取用户基本信息
        batchFecth: prefix + 'user/info/batchget?',//获取用户基本信息
        list: prefix + 'user/get?'//获取用户列表
        //access_token=ACCESS_TOKEN&next_openid=NEXT_OPENID
    },
    mass:{
        group: prefix + 'message/mass/sendall?',//群发与标签消息
        openId: prefix + 'message/mass/send?',//openId群发消息
        del: prefix + 'message/mass/delete?',//删除群发消息
        preview: prefix + 'message/mass/preview?',//预览消息
        check: prefix + 'message/mass/get?',//查询消息状态
    },
    menu:{
        create: prefix + 'menu/create?',//创建菜单 
        fecth: prefix + 'menu/get?',//查询菜单
        current: prefix + 'get_current_selfmenu_info?',//获取菜单配置
        del: prefix + 'menu/delete?'//删除菜单
    },
    qrcode: {
        create: prefix + 'qrcode/create?',//生成带参数的二维码
        show: mpPrefix + 'showqrcode?',//通过ticket换取二维码
        shorturl: prefix + 'shorturl?',//生成带参数的二维码
    },
    ticket:{
        get: prefix + 'ticket/getticket?',//获取api_ticket
    }
}

function Wechat(opts) {
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;
    this.getTicket = opts.getTicket;
    this.saveTicket = opts.saveTicket;
    this.fetchAccessToken();
    
}
//判断access_tokens是否过期
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

//判断api_ticket是否过期
Wechat.prototype.isValidTicket = function(data) {
    if (!data || !data.ticket || !data.expires_in) {
        return false
    }
    var ticket = data.ticket;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());

    if (ticket && now < expires_in) {
        return true
    } else {
        return false
    }
}

//获取access_tokens
Wechat.prototype.fetchAccessToken = function() {
    var that = this;
    return this.getAccessToken()
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
            that.saveAccessToken(data);
            return Promise.resolve(data);
        })
}

//获取api_ticket，用于SDK
Wechat.prototype.fetchTicket = function(access_token) {
    var that = this;
    return this.getTicket()
        .then(function(data) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return that.updateTicket(access_token);
            }
            if (that.isValidTicket(data)) {
                return Promise.resolve(data);
            } else {
                return that.updateTicket(access_token);
            }
        })
        .then(function(data) {
            that.saveTicket(data);
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
//更新api_ticket，用于SDK
Wechat.prototype.updateTicket = function(access_token) {
    var url = api.ticket.get + 'access_token=' + access_token + '&type=jsapi';
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
                    form.access_token = data.access_token;
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true
                }
                if(type === 'news'){
                    options.body = form
                }else{
                    options.formData = form;
                    options.url +=  '&type=' + type;
                }
                request(options).then(function(response) {
                        var _data = response.body;
                        console.log(_data);
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
Wechat.prototype.fecthUesrsTag = function(id, count) {
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
                            throw new Error('Fecth Tag Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//备注用户
Wechat.prototype.remarkUser = function(openId, remark) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.user.remark + 'access_token=' + data.access_token;
                var form = {
                        openid: openId,
                        remark: remark
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

//单个或者批量获取用户基本信息
Wechat.prototype.fecthUsers = function(openIds, lang) {
    var that = this;
    var lang = lang || 'zh_CN';
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var options = {
                    json: true
                }
                if (_.isArray(openIds)) {
                    options.url = api.user.batchFecth + 'access_token=' + data.access_token;
                    var form = {
                        user_list: openIds
                    }
                    options.body = form;
                    options.method = 'POST';
                }else{
                    options.url = api.user.fecth + 'access_token=' + data.access_token + '&openid=' + openIds + '&lang=' +lang; 
                    options.method = 'GET';
                }

                request(options).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Fecth User Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//获取用户列表
Wechat.prototype.listUsers = function(openId) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.user.list + 'access_token=' + data.access_token;
                if (openId) {
                    url += '&next_openid=' + openId;
                }
                request({ method: 'GET', url: url, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('List User Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//分组群发
Wechat.prototype.sendByGroup = function(type, message, groupId) {
    var that = this;
    var msg = {
        filter: {}
    };
    msg[type] = message
    msg.msgtype = type
    if (!groupId) {
        msg.filter.is_to_all = true
    }else{
        msg.filter= {
                is_to_all: false,
                tag_id: groupId
            }
    }
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.group + 'access_token=' + data.access_token;
                request({ method: 'POST', url: url, body: msg, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Send to Group Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//openId群发服务号可用
Wechat.prototype.sendByOpenId = function(type, message, openIds) {
    var that = this;
    var msg = {
        msgtype : type,
        touser  : openIds
    };
    msg[type] = message;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.openId + 'access_token=' + data.access_token;
                console.log(url);
                request({ method: 'POST', url: url, body: msg, json: true }).then(function(response) {
                        var _data = response.body;
                        console.log(_data);
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Send to OponId Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//openId群发服务号可用
Wechat.prototype.deleteMass = function(magId) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.del + 'access_token=' + data.access_token;
                var form ={
                    msg_id : magId
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Delete Mass Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//预览消息
Wechat.prototype.previewMass = function(type, message, openId) {
    var that = this;
    var msg = {
        msgtype : type,
        touser  : openId
    };
    msg[type] = message;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.preview + 'access_token=' + data.access_token;
                request({ method: 'POST', url: url, body: msg, json: true }).then(function(response) {
                        var _data = response.body;
                        console.log(_data);
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Preview Mass Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//openId群发服务号可用
Wechat.prototype.checkMass = function(msgId) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.mass.check + 'access_token=' + data.access_token;
                var form = {
                    msg_id : msgId
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Preview Mass Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//创建菜单
Wechat.prototype.createMenu = function(menu) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.create + 'access_token=' + data.access_token;
                console.log(url);
                request({ method: 'POST', url: url, body: menu, json: true }).then(function(response) {
                        var _data = response.body;
                        console.log(_data);
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Cerate Menu Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//查询菜单
Wechat.prototype.fecthMenu = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.fecth + 'access_token=' + data.access_token;
                request({ method: 'GET', url: url, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Fecth Menu Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//删除菜单
Wechat.prototype.deleteMenu = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .getAccessToken()
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
                var url = api.menu.del + 'access_token=' + data.access_token;
                request({ method: 'GET', url: url, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Delete Menu Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//查询菜单配置
Wechat.prototype.getCurrentMenu = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.menu.current + 'access_token=' + data.access_token;
                request({ method: 'GET', url: url, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Get current Menu Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//创建二维码
Wechat.prototype.createQrcode = function(qr) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.qrcode.create + 'access_token=' + data.access_token;
                request({ method: 'POST', url: url, body: qr, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Create Qrcode Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}

//通过ticket换取二维码
Wechat.prototype.showQrcode = function(ticket) {
    return api.qrcode.show + 'ticket=' + encodeURL(ticket);
}

//创建长链接转短链接
Wechat.prototype.shortUrlQrcode = function(action, url) {
    var that = this;
    var action = action || 'long2short'
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.qrcode.shorturl + 'access_token=' + data.access_token;
                var form = {
                    action : action,
                    long_url : url
                }
                request({ method: 'POST', url: url, body: form, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Create ShortUrlQrcode Fails');
                        }
                    })
                    .catch(function(err) {
                        reject(err)
                    })
            })
    })
}


//创建语义
Wechat.prototype.semantic = function(semanticData) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that
            .fetchAccessToken()
            .then(function(data) {
                var url = api.semanticUrl + 'access_token=' + data.access_token;
                semanticData.appid = data.appID;
                request({ method: 'POST', url: url, body: semanticData, json: true }).then(function(response) {
                        var _data = response.body;
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('Semantic Fails');
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
    var xml = util.tpl(content, message);
    this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
    console.log(xml);
}


module.exports = Wechat;
