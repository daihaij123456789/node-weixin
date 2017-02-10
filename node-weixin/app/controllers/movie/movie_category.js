'use strict';
var moment = require('moment');
var Category = require('../../models/movie/movie_category')// 电影分类模型                 // 电影分类模型
var co = require('co');
// 新建电影分类控制器
exports.new = co.wrap(function* (ctx, next){
  yield ctx.render('pages/movie/movie_category_admin', {
    title:'大海电影后台分类录入页',
    logo:'movie',
    category:{},
    moment:moment
  });
}) 
// 电影分类存储控制器
exports.save = co.wrap(function* (ctx, next){
  var category = ctx.request.body.category;
  // 判断新创建的电影分类是否已存在，避免重复输入
  var _category = yield Category.findOne({name:category.name}).exec();
    if(_category) {
      console.log('电影分类已存在');
      res.redirect('/admin/movie/movieCategory/list');
    }else {
      var newCategory = new Category(category);
      yield newCategory.save()
        res.redirect('/admin/movie/movieCategory/list');
    }
})
// 电影分类控制器
exports.list = co.wrap(function* (ctx, next){
  var categories = yield Category
    .find({})
    .populate({
      path:'movies',                        // 通过movies属性查找电影分类所对应的电影名称
      select:'title',
    })
    .exec();
      yield ctx.render('pages/movie/movie_category_list',{
        title:'大海电影分类列表页',
        logo:'movie',
        categories:categories,
        moment:moment
      })
}) 

// 电影分类列表删除控制器
exports.del = co.wrap(function* (ctx,next) {
  // 获取客户端Ajax发送的URL值中的id值
  var id  = ctx.query.id;
  if(id) {
    // 如果id存在则服务器中将该条数据删除并返回删除成功的json数据
      yield Category.remove({_id:id}).exec();
      this.body ={success:1};
    }else{
      this.body ={success:0};
    }  
})
