'use strict';
var User = require('../../models/user/user');// 用户数据模型               
var ccap = require('ccap')();                    // 加载验证码模块
var co = require('co');                                 // 申明验证码变量
var moment = require('moment');
/* 用户注册及登录框中验证码生成器控制器 */
exports.captcha = co.wrap(function*(ctx,next) {
  if(ctx.url === '/favicon.ico') {
    return ctx.end('');
  }
    var ary = ccap.get();
    var captchaA  = ary[0];
    /*//var buf = ary[1];*/
    ctx.body = captchaA;
    ctx.session.captchaA = captchaA

})
/* 用户注册控制器 */
exports.signup = co.wrap(function*(ctx,next) {
  
  var user1 = ctx.request.body.user,                       // 获取post请求中的用户数据
      _user = {};
  user1 = user1.split('&');
  
  for(var i = 0; i < user1.length; i++) {
    var p = user1[i].indexOf('='),
        name = user1[i].substring(0,p),
        value = user1[i].substring(p+1);
    _user[name] = value;
  }
  
  var _name = _user.name || '',
      _captcha = _user.captcha || '';

  // 使用findOne对数据库中user进行查找
  var user = yield User.findOne({name:_name}).exec();
    // 如果用户名已存在
    if(user) {
      ctx.body = {data:0};
    }else{
      var captchaB = ctx.session.captchaA
      // 验证码存在
      if (captchaB) {
        if(_captcha.toLowerCase() !== captchaB.toLowerCase()) {
          ctx.body = {data:1};             // 输入的验证码不相等
        }else {
          // 数据库中没有该用户名，将其数据生成新的用户数据并保存至数据库
          user = new User(_user);            // 生成用户数据
          yield user.save();
            ctx.session.user = user;         // 将当前登录用户名保存到session中
            ctx.body = {data:2};       // 注册成功
            
        }
      }
    }
})

/* 用户注册页面渲染控制器 */
exports.showSignup = co.wrap(function*(ctx,next) {
  yield ctx.render('pages/user/signup', {
    title:'注册页面',
    logo:'movie',
    moment:moment
  });
})

/* 用户登陆控制器 */
exports.signin = co.wrap(function*(ctx,next) {
  var user1 = ctx.query.user || '',        // 获取get请求中的用户数据
      _user = {};
  user1 = user1.split('&');
  for(var i = 0; i < user1.length; i++) {
    var p = user1[i].indexOf('='),
        name = user1[i].substring(0,p),
        value = user1[i].substring(p+1);
    _user[name] = value;
  }
  var _name = _user.name || '',
      _password = _user.password || '',
      _captcha = _user.captcha || '';
 var user = yield User.findOne({name:_name}).exec();
    if(!user) {
      ctx.body = {data:0};                 // 用户不存在
    }
    // 使用user实例方法对用户名密码进行比较
    var isMatch = yield user.comparePassword(_password);
      // 密码匹配
      if(isMatch) {
        var captchaB = ctx.session.captchaA 
        // 验证码存在
        if (captchaB) {
          if(_captcha.toLowerCase() !== captchaB.toLowerCase()) {
            console.log('成功');
            ctx.body = {data:2};                   // 输入的验证码不相等
          }else {
            ctx.session.user = user;                // 将当前登录用户名保存到session中
            ctx.body = {data:3};              // 登录成功
          }
        }
      }else {
        // 账户名和密码不匹
        ctx.body = {data:1};
      }
})

/* 用户登录页面渲染控制器 */
exports.showSignin = co.wrap(function*(ctx,next)  {
  yield ctx.render('pages/user/signin',{
    title:'登录页面',
    logo:'movie',
    moment:moment
  });
})

/* 用户登出控制器 */
exports.logout = co.wrap(function*(ctx,next) {
  delete ctx.session.user;
  ctx.redirect('/');
  yield next();
})
/* 用户列表页面渲染控制器 */
exports.list = co.wrap(function*(ctx,next) {
  var users = yield User.find({})
                        .sort('meta.updateAt')
                        .exec();
      console.log(users);
      yield ctx.render('pages/user/user_list', {
          title: '大海电影用户列表页',
          users: users,
          logo:'movie',
          moment:moment
      })
})

/* 用户列表删除电影控制器 */
exports.del = co.wrap(function*(ctx,next) {
  // 获取客户端Ajax发送的URL值中的id值
  var id  = ctx.query.id;
  if(id) {
    // 如果id存在则服务器中将该条数据删除并返回删除成功的json数据
    yield User.remove({_id:id}).exec();
      ctx.body = {success:1};              // 删除成功
  }
})

/* 用户是否登陆判断中间件 */
exports.signinRequired = co.wrap(function*(ctx,next) {
  var _user = ctx.session.user;
  if(!_user) {
    ctx.redirect('/signin');
  }
  yield next()
})

/* 用户权限中间件 */
exports.adminRequired = co.wrap(function*(ctx,next) {
  var _user = ctx.session.user;
  if(_user && _user.role <= 10){
    ctx.redirect('/signin');
  }
  yield next()
})
