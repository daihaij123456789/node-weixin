本项目基于Scott的7天公众号开发课程与Loogeek的https://github.com/Loogeek/douban_Website（npm安装参考这里，注意ccap模块在window下，必须先安装Python与vs2015(c++编译环境)）源码之上改写电影和音乐网站。
技术堆栈：nodejs +koa2 +gulp +jade +weixinApi。加入微信公众号开发。该源码包括所有微信API接口调用。

项目后端搭建:
使用NodeJs的koa2框架完成电影与音乐网站后端搭建;(采用TJ大神co库同步方式执行异步代码，大坑，与Scott老师讲课已经完全不一样呢)。
使用mongodb完成数据存储,通过mongoose模块完成对mongodb数据的构建;
使用jade模板引擎完成页面创建渲染;
使用moment模块格式化电影存储时间;(注意与express差距，坑)
注意：自己采用Jquery改写音乐歌词同步，现在快进有一点小bug，欢迎修改。
2. 项目前端搭建:

使用jQuery和Bootsrap完成网站前端JS脚本和样式处理;
使用Sass完成电影和音乐首页样式的编写;
使用validate.js完成对账号登录注册的判断;
使用jQuery lazyload插件对首页图片的延迟加载;
使用fullpage.js完成电影宣传页面制作;
前后端的数据请求交互通过Ajax完成;
3. 本地开发环境搭建:

使用gulp集成jshint对JS语法检查，Sass文件编译、压缩等功能，使用mocha完成用户注册存储等步骤的简单单元测试，以及服务器的自动重启等功能。
