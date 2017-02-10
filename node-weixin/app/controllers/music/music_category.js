'use strict';
var MusicCategory = require('../../models/music/music_category') //引入音乐分类模型       
var Programme = require('../../models/music/music_programme'); //引入近期热门歌单区域模型 
var _ = require('lodash'); // 该模块用来对变化字段进行更新
var co = require('co');
var moment = require('moment');
// 音乐分类后台录入页控制器
exports.new = co.wrap(function*(ctx, next) {
    // 输出当前全部的音乐榜单
    var programmes = yield Programme.find({}).exec();
    yield ctx.render('pages/music/music_category_admin', {
        title: '大海音乐后台分类录入页',
        logo: 'music',
        programmes: programmes,
        musicCategory: {},
        moment:moment
    });
})

// 保存音乐分类控制器
exports.save = co.wrap(function*(ctx, next) {
    var musicCategoryObj = ctx.request.body.musicCategory, // 获取当前填写的音乐分类
        musicCatId = musicCategoryObj._id, // 如果存在则是对已存在音乐分类的更新
        musicCatName = musicCategoryObj.name, // 输入的分类名称
        programmeId = musicCategoryObj.programme, // 获取填写的音乐榜单分类ID
        programmeName = musicCategoryObj.programmeName; // 获取榜单分类名
    // 如果musicCatId值存在，则说明是对已存在音乐分类数据进行更新
    if (musicCatId) {
        // 查找原音乐分类
        var _musicCat = yield MusicCategory.findOne({ _id: musicCatId }).exec();
        // 如果输入后歌曲榜单与原歌曲榜单不同，则说明更新了音乐榜单
        if (programmeId.toString() !== _musicCat.programme.toString()) {
            // 如果原歌曲榜单存在
            if (_musicCat.programme.length > 0) {
                var _oldProgramme = yield Programme.findOne({ _id: _musicCat.programme }).exec();
                // 在原歌曲榜单的musicCategories属性中找到该歌曲分类的musicCatId值并将其删除
                var index = _oldProgramme.musicCategories.indexOf(musicCatId);
                _oldProgramme.musicCategories.splice(index, 1);
                yield _oldProgramme.save();
            }
            // 找到音乐分类对应的新歌曲榜单
            var _newProgramme = yield Programme.findById({ _id: programmeId }).exec();
            // 将其musicCatId值添加到musicCategories属性中并保存
            _newProgramme.musicCategories.push(musicCatId);
            yield _newProgramme.save();
        }
        // 使用underscore模块的extend函数更新修改的音乐分类字段
        _musicCat = _.extend(_musicCat, musicCategoryObj);
        yield _musicCat.save();
        ctx.redirect('/admin/music/programme/list');
        // 如果不是更新音乐分类，并且输入了音乐分类名称
    } else if (musicCatName) {
        // 查找输入的音乐分类名称是否已存在
        var _musicCatName = yield MusicCategory.findOne({ name :musicCatName }).exec();
        if (_musicCatName) {
            console.log('音乐分类已存在');
            ctx.redirect('/admin/music/programme/list');
        } else {
            // 创建一个新音乐分类数据
            var musicCategory = new MusicCategory({
                name: musicCatName
            });
            yield musicCategory.save();
            // 如果选择了热门榜单分类
            if (programmeId) {
                var programme = yield Programme.findOne({ _id: programmeId }).exec();
                // 将该音乐分类添加到榜单分类的属性中
                programme.musicCategories.push(_newMusicCategory._id);
                yield programme.save();
                // 新建音乐分类的programme指向该榜单
                _newMusicCategory.programme = programmeId;
                yield _newMusicCategory.save();
                ctx.redirect('/admin/music/programme/list');
                // 输入新的音乐榜单分类
            } else if (programmeName) {
                var _programme = yield Programme.findOne({ name: programmeName }).exec();
                if (_programme) {
                    console.log('音乐榜单分类已存在');
                    ctx.redirect('/admin/music/programme/list');
                } else {
                    var newProgramme = new Programme({
                        name: programmeName,
                        musicCategories: _newMusicCategory._id
                    });
                    // 保存新创建的音乐榜单分类
                    yield newProgramme.save();
                    if (_newMusicCategory) {
                        // 将新创建的音乐榜单保存，programme的ID值为对应的分类ID值
                        // 这样可通过populate方法进行相应值的索引
                        _newMusicCategory.programme = _newProgramme._id;
                        yield _newMusicCategory.save()
                    }
                    ctx.redirect('/admin/music/programme/list');
                }
            } else {
                ctx.redirect('/admin/music/programme/list');
            }
        }
        // 如果只输入了榜单名称
    } else if (programmeName) {
        // 查找输入的榜单名称是否已存在
        var _programme = yield Programme.findOne({ name: programmeName }).exec();
        if (_programme) {
            console.log('音乐榜单分类已存在');
            ctx.redirect('/admin/music/programme/list');
        } else {
            var newProgramme = new Programme({
                name: programmeName
            });
            // 保存新创建的音乐榜单分类
            yield newProgramme.save();
            ctx.redirect('/admin/music/programme/list');
        }
        // 其他操作值重定向到list页
    } else {
        ctx.redirect('/admin/music/programme/list');
    }
})

// 音乐分类列表页控制器
exports.list = co.wrap(function*(ctx, next) {
    var musicCategories = yield MusicCategory
        .find({})
        .populate({
            path: 'musics',
            select: 'title image singer version summary pv',
        })
        .exec();
    yield ctx.render('pages/music/music_category_list', {
        title: '大海音乐分类列表页',
        logo: 'music',
        musicCategories: musicCategories,
        moment:moment
    });
})

// 大海音乐分类详细页面控制器
exports.detail = co.wrap(function*(ctx, next) {
    var _id = ctx.params.id;
    // 音乐用户访问统计，每次访问音乐详情页，PV增加1
    yield MusicCategory.update({ _id: _id }, { $inc: { pv: 1 } }).exec();
})

// 更新音乐分类控制器
exports.update = co.wrap(function*(ctx, next) {
    var _id = ctx.params.id;
    var musicCategory = yield MusicCategory.findOne({ _id: _id }).exec();
    var programmes = Programme.find({}).exec();
    yield ctx.render('pages/music/music_category_admin', {
        title: '大海音乐后台更新页',
        logo: 'music',
        musicCategory: musicCategory,
        programmes: programmes,
        moment:moment
    });
})

// 音乐分类列表删除音乐控制器
exports.del = co.wrap(function*(ctx, next) {
    // 获取客户端Ajax发送的URL值中的id值
    var id = ctx.query.id;
    if (id) {
        // 如果id存在则服务器中将该条数据删除并返回删除成功的json数据
        yield MusicCategory.remove({ _id: id }).exec();
        ctx.body = { success: 1 };
    }else{
        ctx.body = { success: 0 };
    }
})
