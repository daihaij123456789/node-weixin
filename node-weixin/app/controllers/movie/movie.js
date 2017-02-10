'use strict';
var Movie = require('../../models/movie/movie'); // 电影数据模型
var Category = require('../../models/movie/movie_category'); // 电影分类模型
var MovieComment = require('../../models/movie/movie_comment'); // 电影评论模型      
var co = require('co');
var _ = require('lodash'); // 该模块用来对变化字段进行更新
var fs = require('fs'); // 读写文件模块
var path = require('path'); // 路径模块
var moment = require('moment');

// 详细页面控制器
exports.detail = co.wrap(function*(ctx, next) {
    var id = ctx.params.id; // 获取URL中的电影ID
    // 电影用户访问统计，每次访问电影详情页，PV增加1
    yield Movie.update({ _id: id }, { $inc: { pv: 1 } }).exec();
    // MovieComment存储到数据库中的movie属性值与相应的Movie _id值相同
    var movie = yield Movie.findOne({ _id: id }).exec()
    var comments = yield MovieComment
        .find({ movie: id })
        .populate('from', 'name')
        .populate('reply.from reply.to', 'name') // 查找评论人和回复人的名字
        .exec();
    yield ctx.render('pages/movie/movie_detail', {
        title: '大海电影详情页',
        logo: 'movie',
        movie: movie,
        comments: comments,
        moment: moment
    })
})

// 后台录入控制器
exports.new = co.wrap(function*(ctx, next) {
    var categories = yield Category.find({}).exec();
    yield ctx.render('pages/movie/movie_admin', {
        title: '大海电影后台录入页',
        logo: 'movie',
        categories: categories,
        moment: moment,
        movie: {}
    });
})



// 存储海报控制器
// exports.savePoster = co.wrap(finction* (ctx, next){
//   // 如果有文件上传通过connect-multiparty中间件生成临时文件并通过req.files进行访问
//   // 并且当提交表单中有文件上传请求时表单要使用enctype="multipart/form-data"编码格式
//   var posterData = req.files.uploadPoster,                    // 上传文件
//       filePath = posterData.path,                             // 文件路径
//       originalFilename = posterData.originalFilename;         // 原始名字
//   // 如果有自定义上传图片，则存在文件名
//   if(originalFilename) {
//     fs.readFile(filePath, function(err,data) {
//       if(err) {
//         console.log(err);
//       }
//       var timestamp = Date.now(),                             // 获取时间
//           type = posterData.type.split('/')[1],               // 获取图片类型 如jpg png
//           poster = timestamp + '.' + type,                    // 上传海报新名字
//           // 将新创建的海报图片存储到/public/upload 文件夹下
//           newPath = path.join(__dirname,'../../../','/public/upload/movie/' + poster);
//       // 写入文件
//       fs.writeFile(newPath,data,function(err) {
//         if(err) {
//           console.log(err);
//         }
//         req.poster = poster;
//         next();
//       });
//     });
//   }else {
//     // 没有自定义上传海报
//     next();
//   }
// }) 


// 后台录入控制器
exports.save = co.wrap(function*(ctx, next) {
    var movieObj = ctx.request.body.movie,
        id = movieObj._id,
        categoryId = movieObj.category, // 获取电影分类ID
        categoryName = movieObj.categoryName; // 获取新创建的电影分类名称
    // 如果有自定义上传海报  将movieObj中的海报地址改成自定义上传海报的地址
    if (ctx.poster) {
        movieObj.poster = ctx.poster;
    }
    // 如果数据已存在，则更新相应修改的字段
    if (id) {
        var _movie = yield Movie.findOne({ _id: id }).exec();
        // 如果修改电影分类
        if (movieObj.category.toString() !== _movie.category.toString()) {
            // 找到电影对应的原电影分类
            var _oldCat = yield Category.findOne({ _id: _movie.category }).exec();
            // 在原电影分类的movies属性中找到该电影的id值并将其删除
            var index = _oldCat.movies.indexOf(id);
            _oldCat.movies.splice(index, 1);
            yield _oldCat.save();
                // 找到电影对应的新电影分类
            var _newCat = yield Category.findOne({ _id: movieObj.category }).exec();
            // 将其id值添加到电影分类的movies属性中并保存
            _newCat.movies.push(id);
            yield _newCat.save();
        }
        // 使用lodash模块的extend函数更新电影变化的属性
        _movie = _.extend(_movie, movieObj);
        yield _movie.save();
        ctx.redirect('/movie/' + _movie._id); // 重镜像到电影详情页
        // 如果是新录入电影 并且输入了电影名称
    } else if (movieObj.title) {
        // 查找该电影名称是否已存在
       var _movie =yield Movie.findOne({ title: movieObj.title }).exec();
            if (_movie) {
                console.log('电影已存在');
                res.redirect('/admin/movie/list');
            } else {
                // 创建一个新电影数据
                var _newMovie = new Movie(movieObj);
                yield _newMovie.save();
                    // 如果选择了电影所属的电影分类
                    if (categoryId) {
                        var _category =yield Category.findById({_id:categoryId}).exec();
                            _category.movies.push(_newMovie._id);
                            yield _category.save()
                                res.redirect('/movie/' + _newMovie._id);
                        // 输入新的电影分类
                    } else if (categoryName) {
                        // 查找电影分类是否已存在
                       var _categoryName = Category.findOne({ name: categoryName }).exec();
                            if (_categoryName) {
                                console.log('电影分类已存在');
                                res.redirect('/admin/movie/movieCategory/list');
                            } else {
                                // 创建新的电影分类
                                var category = new Category({
                                    name: categoryName,
                                    movies: [_newMovie._id]
                                });
                                // 保存新创建的电影分类
                               yield category.save();
                                    // 将新创建的电影保存，category的ID值为对应的分类ID值
                                    _newMovie.category = category._id;
                                    yield _newMovie.save()
                                        res.redirect('/movie/' + movie._id);
                            }
                        // 如果没有选择电影所属分类 重定向到当前页
                    } else {
                        res.redirect('/admin/movie/list');
                    }
            }
        // 没有输入电影名称 而只输入了电影分类名称
    } else if (categoryName) {
        // 查找电影分类是否已存在
       var _categoryName = Category.findOne({ name: categoryName }).exec();
            if (_categoryName) {
                console.log('电影分类已存在');
                res.redirect('/admin/movie/movieCategory/list');
            } else {
                // 创建新的电影分类
                var newCategory = new Category({
                    name: categoryName
                });
                // 保存新创建的电影分类
                yield newCategory.save()
                    res.redirect('/admin/movie/movieCategory/list');
            }
        // 既没有输入电影名称和分类则数据录入失败 重定向到当前页
    } else {
        res.redirect('/admin/movie/new');
    }
})

// 修改电影数据控制器
exports.update = co.wrap(function*(ctx, next) {
    var id = ctx.params.id;
    var movie = yield Movie.findOne({ _id: id }).exec()
    var categories = yield Category.find({}).exec();
    yield ctx.render('pages/movie/movie_admin', {
        title: '大海电影后台更新页',
        logo: 'movie',
        movie: movie,
        moment: moment,
        categories: categories
    });
});



// 电影列表控制器
exports.list = co.wrap(function*(ctx, next) {
    var movies = yield Movie.find({})
        .populate('category', 'name')
        .exec();
    yield ctx.render('pages/movie/movie_list', {
        title: '大海电影列表页',
        logo: 'movie',
        moment: moment,
        movies: movies
    });
})



// 电影列表删除电影控制器
exports.del = co.wrap(function*(ctx, next) {
    // 获取客户端Ajax发送的请求中的id值
    var id = ctx.query.id;
    // 如果id存在则服务器中将该条数据删除并返回删除成功的json数据
    if (id) {
        yield Movie.remove({ _id: id }).exec();
        ctx.body = { success: 1 };
    } else {
        ctx.body = { success: 0 };
    }
})
