'use strict';
var Music = require('../../models/music/music') // 音乐数据模型
var MusicCategory = require('../../models/music/music_category') //引入音乐分类模型       
var MusicComment = require('../../models/music/music_comment'); // 音乐评论数据模型
var _ = require('lodash'); // 该模块用来对变化字段进行更新
var co = require('co');
var fs = require('fs'); // 读写文件模块
var path = require('path'); // 路径模块l
var moment = require('moment');//格式时间
/* 详细页面控制器 */
exports.detail = co.wrap(function*(ctx, next) {
    var _id = ctx.params.id;
    // 音乐用户访问统计，每次访问音乐详情页，PV增加1
    yield Music.update({ _id: _id }, { $inc: { pv: 1 } }).exec();
    // MusicComment存储到数据库中的_id值与相应的Music _id值相同
    var music = yield Music.findOne({ _id: _id }).exec();
    var comments = yield MusicComment
        .find({ music: _id }) // 查找该_id值所对应的评论信息
        .populate('from', 'name')
        .populate('reply.from reply.to', 'name') // 查找评论人和回复人的名字
        .exec();
    yield ctx.render('pages/music/music_detail', {
        title: '大海音乐详情页',
        logo: 'music',
        music: music,
        comments: comments,
        moment:moment
    });
})

/* 后台录入控制器 */
exports.new = co.wrap(function*(ctx, next) {
    var musicCategories = yield MusicCategory.find({}).exec();
    yield ctx.render('pages/music/music_admin', {
        title: '大海音乐后台录入页',
        logo: 'music',
        musicCategories: musicCategories,
        music: {}
    });
})

/* 存储海报控制器 */
/*exports.savePoster = co.wrap(function*(ctx, next) {
    var imageData = ctx.files.uploadMusicImage, // 上传文件
        filePath = imageData.path, // 文件路径
        originalFilename = imageData.originalFilename; // 原始名字

    if (originalFilename) {
        fs.readFile(filePath, function(err, data) {
            if (err) {
                console.log(err);
            }
            var timestamp = Date.now(), // 获取时间
                type = imageData.type.split('/')[1], // 获取图片类型 如jpg png
                image = timestamp + '.' + type, // 上传海报新名字
                // 将新创建的海报图片存储到/public/upload 文件夹下
                newPath = path.join(__dirname, '../../../', '/public/upload/music/' + image);

            // 写入文件
            fs.writeFile(newPath, data, function(err) {
                if (err) {
                    console.log(err);
                }
                req.image = image;
                next();
            });
        });
    } else {
        // 没有自定义上传海报
        next();
    }
})*/

/* 后台录入控制器 */
exports.save = co.wrap(function*(ctx, next) {
    var id = ctx.request.body.music._id, // 如果是更新音乐则获取到该音乐ID值
        musicObj = ctx.request.body.music, // 获取音乐新建表单发送的数据
        musicCategoryId = musicObj.musicCategory, // 获取音乐所属分类ID值
        musicCategoryName = musicObj.musicCategoryName; // 获取音乐所属分类名称
    // 如果有自定义上传海报  将musicObj中的海报地址改成自定义上传海报的地址
    if (ctx.image) {
        musicObj.image = ctx.image;
    }
    // 如果id值存在，则说明是对已存在的数据进行更新
    if (id) {
        var _music = yield Music.findOne({ _id: id }).exec();
        // 如果输入后歌曲分类与原歌曲分类不同，则说明更新了音乐分类
        if (musicObj.musicCategory.toString() !== _music.musicCategory.toString()) {
            // 找到音乐对应的原歌曲分类
            var _oldCat = yield MusicCategory.findOne({ _id: _music.musicCategory }).exec();
            // 在原歌曲分类的musics属性中找到该歌曲的id值并将其删除
            var index = _oldCat.musics.indexOf(id);
            _oldCat.musics.splice(index, 1);
            yield _oldCat.save();
            // 找到音乐对应的新歌曲分类
            var _newCat = yield MusicCategory.findOne({ _id: musicObj.musicCategory }).exec();
            // 将其id值添加到musics属性中并保存
            _newCat.musics.push(id);
            yield _newCat.save();
        }
        // 使用underscore模块的extend函数更新音乐变化的属性
        _music = _.extend(_music, musicObj);
        yield _music.save();
        ctx.redirect('/music/' + _music._id);
        // 如果表单中填写了音乐名称 则查找该音乐名称是否已存在
    } else if (musicObj.title) {
        var _music = yield Music.findOne({ title: musicObj.title }).exec();
        if (_music) {
            console.log('音乐已存在');
            ctx.redirect('/admin/music/list');
        } else {
            // 创建一个音乐新数据
            var newMusic = new Music(musicObj);
            yield newMusic.save()
                // 选择了音乐所属的音乐分类
            if (musicCategoryId) {
                var _musicCategory = yield MusicCategory.findOne({ _id: musicCategoryId }).exec();
                _musicCategory.musics.push(_newMusic._id);
                yield _musicCategory.save()
                ctx.redirect('/music/' + _newMusic._id);
                // 输入新的音乐分类
            } else if (musicCategoryName) {
                // 查找音乐分类是否已存在
                var _musicCategoryName = yield MusicCategory.findOne({ name: musicCategoryName }).exec();
                if (_musicCategoryName) {
                    console.log('音乐分类已存在');
                    ctx.redirect('/admin/music/musicCategory/list');
                } else {
                    //创建新的音乐分类
                    var musicCategory = new MusicCategory({
                        name: musicCategoryName,
                        musics: [_newMusic._id]
                    });
                    // 保存新创建的音乐分类
                    yield musicCategory.save()
                        // 将新创建的音乐保存，musicCategory的ID值为对应的分类ID值
                        // 这样可通过populate方法进行相应值的索引
                    _newMusic.musicCategory = musicCategory._id;
                    yield _newMusic.save()
                    ctx.redirect('/music/' + music._id);
                }
            } else {
                ctx.redirect('/admin/music/list');
            }
        }
        // 没有输入音乐名称 而只输入了歌曲分类名称
    } else if (musicCategoryName) {
        // 查找音乐分类是否已存在
        var _musicCategoryName = yield MusicCategory.findOne({ name: musicCategoryName }).exec();
        if (_musicCategoryName) {
            console.log('音乐分类已存在');
            ctx.redirect('/admin/music/musicCategory/list');
        } else {
            // 创建新的音乐分类
            var musicCategory = new MusicCategory({
                name: musicCategoryName
            });
            // 保存新创建的音乐分类
            yield musicCategory.save();
            ctx.redirect('/admin/music/musicCategory/list');
        }
        // 没有输入音乐名称或分类则重定向到该页
    } else {
        console.log('需要输入音乐分类或音乐名称');
        ctx.redirect('/admin/music/new');
    }
})

/* 更新音乐控制器 */
exports.update = co.wrap(function*(ctx, next) {
    var _id = ctx.params.id;

    var music = yield Music.findOne({ _id: _id }).exec();
    var musicCategories = yield MusicCategory.find({}).exec();
    yield ctx.render('pages/music/music_admin', {
        title: '大海音乐后台更新页',
        logo: 'music',
        music: music,
        musicCategories: musicCategories,
        moment:moment
    });
})

/* 音乐列表控制器 */
exports.list = co.wrap(function*(ctx, next) {
    var musics = yield Music.find({})
        .populate('musicCategory', 'name')
        .exec();
    yield ctx.render('pages/music/music_list', {
        title: '大海音乐列表页',
        logo: 'music',
        musics: musics,
        moment:moment
    });
})

/* 音乐列表删除音乐控制器 */
exports.del = co.wrap(function*(ctx, next) {
        // 获取客户端Ajax发送的URL值中的id值
        var id = ctx.query.id;
        // 如果id存在则服务器中将该条数据删除并返回删除成功的json数据
        if (id) {
            var music = yield Music.findOne({ _id: id }).exec();
            // 查找包含这条音乐的音乐分类
            var musicCategory = yield MusicCategory.findOne({ _id: music.musicCategory }).exec();
            // 在音乐分类musics数组中查找该值所在位置
            if (musicCategory) {
                var index = musicCategory.musics.indexOf(id);
                musicCategory.musics.splice(index, 1); // 从分类中删除该数据
                yield musicCategory.save();
            }
            yield Music.remove({ _id: id }).exec();
            ctx.body = { success: 1 } // 返回删除成功的json数据给游览器
        }
})