'use strict';
var co = require('co');
var MovieComment = require('../../models/movie/movie_comment'); // 电影评论模型
// 电影评论后台录入控制器
exports.save = co.wrap(function*(ctx, next) {
    var _comment = ctx.request.body.comment; // 获取post发送的数据
    // 如果存在cid说明是对评论人进行回复
    if (_comment.cid) {
        // 通过点击回复一条电影评论的id，找到这条评论的内容
        var comment = yield MovieComment.findOne({ _id: _comment.cid }).exec();
        var reply = {
            from: _comment.from, // 回复人
            to: _comment.tid, // 被回复人
            content: _comment.content, // 回复内容
            meta: {
                createAt: Date.now()
            }
        };
        comment.reply.push(reply); // 添加到评论的数组中
        // 保存该条评论的回复内容
        yield comment.save();
        // 在数据库中保存用户回复后会生成一条该评论的_id，服务器查找该_id对应的值返回给客户端
        var comments = yield MovieComment
            .findOne({ _id: comment._id })
            .populate('from', 'name')
            .populate('reply.from reply.to', 'name') // 查找评论人和回复人的名字
            .exec()
        ctx.body = { data: comments };
        // 简单的评论，不是对评论内容的回复
    } else {
        // 将用户评论创建新对象并保存
        var comment = new MovieComment(_comment);
        yield comment.save();
        // 在数据库中保存用户评论后会生成一条该评论的_id，服务器查找该_id对应的值返回给客户端
        var comments = yield MovieComment
            .findOne({ _id: comment._id })
            .populate('from', 'name')
            .populate('reply.from reply.to', 'name') // 查找评论人和回复人的名字
            .exec();
        ctx.body = { data: comments };
    }
})

// 删除电影评论控制器
exports.del = co.wrap(function*(ctx, next) {
    // 获取客户端Ajax发送的URL值中的id值
    var cid = ctx.query.cid, // 获取该评论的id值
        did = ctx.query.did; // 获取各条回复评论的id值
    // 如果点击的是叠楼中的回复评论的删除按钮

    if (did !== 'undefined') {

        // 先查找到该叠楼评论
        var comment = yield MovieComment.findOne({ _id: cid }).exec();
        var len = comment.reply.length; // 获取该叠楼评论中回复评论的条数
        for (var i = 0; i < len; i++) {
            // 如果找到该叠楼中点击删除的评论，则将其评论删除
            if (comment.reply[i] && comment.reply[i]._id.toString() === did) {
                comment.reply.splice(i, 1);
            }
        }
        // 保存评论
        yield comment.save();
        ctx.body = { success: 1 };
        // 若是点击第一条评论中的删除
    } else {
        
    yield MovieComment.remove({ _id: cid }).exec();
     ctx.body = { success: 1 }
        
    }
})
