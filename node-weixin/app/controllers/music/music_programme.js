'use strict';

/* 热门歌单控制器 */
var Programme = require('../../models/music/music_programme'); //引入近期热门歌单区域模型
var co = require('co');
var moment = require('moment');
// 音乐热门歌单列表页面渲染函数
exports.list = co.wrap(function*(ctx, next) {
    var programmes = yield Programme
        .find({})
        .populate({
            path: 'musicCategories',
            select: 'name',
        })
        .exec();
    yield ctx.render('pages/music/music_programme_list', {
        title: '音乐热门歌单列表页',
        logo: 'music',
        programmes: programmes,
        moment:moment
    });
})

// 音乐热门歌单列表页删除相应榜单名处理函数
exports.del = co.wrap(function*(ctx, next) {
    // 获取客户端Ajax发送的URL值中的id值
    var id = req.query.id;
    if (id) {
        // 如果id存在则服务器中将该条数据删除并返回删除成功的json数据
        yield Programme.remove({ _id: id }).exec();
        ctx.body = { success: 1 };
    }
})
