'use strtic'
var User = require('../models/user/user');
var co = require('co');
var _ = require('lodash');
//signup注册页
exports.signup = co.wrap(function* (ctx, next) {
    var _user = ctx.request.body.user;
     var user = yield User.findOne({ name: _user.name }).exec(); 
        if (user) {
             yield ctx.redirect('/signin');
             yield next()
        } else {
            user = new User(_user);
            yield user.save(); 
            ctx.redirect('/');
            yield next;
        }
})

//showSignup注册页
exports.showSignup =  co.wrap(function* (ctx, next) {
        yield ctx.render('pages/signup', {
            title: '注册页面'
        });
})
//showSignin登陆页
exports.showSignin =  co.wrap(function* (ctx, next) {
        yield ctx.render('pages/signin', {
            title: '登陆页面'
        });
})
//userlist列表页
exports.list =  co.wrap(function* (ctx, next) {
    var users = yield User.find({})
                        .sort('meta.updateAt')
                        .exec();
        yield ctx.render('pages/userlist', {
            title: '用户列表页',
            users: users
        })
})
//登陆权限控制中间键
exports.signinRequired =  co.wrap(function* (ctx, next) {
    var user = ctx.session.user;
    if (!user) {
        yield ctx.redirect('/signin');
    }else{
        yield next;
    }
    
})
//管理权限控制中间键
exports.adminRequired =  co.wrap(function* (ctx, next) {
    var user = ctx.session.user;
    if (user.role <= 10) {
        yield ctx.redirect('/signin');
    }else{
        yield next;
    }   
})
//signin登陆页
exports.signin = co.wrap(function* (ctx, next) {
    var _user = ctx.request.body.user;
    var name=_user.name;
    var password=_user.password;
    var user = yield User.findOne({ name:name }).exec();
        if (!user) {
            ctx.redirect('/signup');
            yield next;
        }
        var isMatch = yield user.comparePassword(password)
          if (isMatch) {
           ctx.session.user=user;
            yield ctx.redirect('/');
            yield next;
          }else{
            yield ctx.redirect('/signin');
            yield next;
          }
})
//logout登出页
exports.logout =co.wrap(function* (ctx, next) {
    delete ctx.session.user;
    //delete ctx.locals.user
    yield ctx.redirect('pages/');
})

//删除用户列表页
exports.delete = co.wrap(function* (ctx, next) {
    var id = ctx.query.id;
    if (id) {
        User.remove({ _id: id }).exce();
           try{
            ctx.body = { success: 1 }
        } catch(err){
            console.log(err);
            ctx.body = { success: 0 }
        }                   
    }
})
