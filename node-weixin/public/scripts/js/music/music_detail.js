'use strict';

$.support.cors = true; // 解决IE8/9 Ajax跨域请求问题

$(function() {

    // 格式化时间函数
    function padding(number) {
        return number < 10 ? '0' + number : '' + number;
    }

    function format(date) {
        return padding(date.getMonth() + 1) + '-' + padding(date.getDate()) + ' ' + padding(date.getHours()) + ':' + padding(date.getMinutes());
    }

    // 设置豆瓣音乐评分图片的样式
    // 获取该歌曲的豆瓣评分来设置图片的Y轴位置，显示相应评分对象的星星数
    var musicStar = Math.ceil($('.rating-num strong').html() - 10) * 15;
    $('.star').css('background-position-y', musicStar);


    // 评论区回复评论事件
    $('#mediaList').on('click', '.comment', function() {
        var target = $(this), // 获取点击回复的评论对象
            toId = target.data('tid'), // 被评论人的ID值
            commentId = target.data('cid'); // 该条评论内容的ID值
        // 给当前要叠楼回复的楼主添加ID值
        $(target).parents('.media-body').attr('id', 'mediaBody');
        if ($('#toId').length > 0) {
            $('#toId').val(toId);
        } else {
            $('<input>').attr({
                type: 'hidden',
                id: 'toId',
                name: 'comment[tid]',
                value: toId // 被评论人ID
            }).appendTo('#commentForm');
        }

        if ($('#commentId').length > 0) {
            $('#commentId').val(commentId);
        } else {
            $('<input>').attr({
                type: 'hidden',
                id: 'commentId',
                name: 'comment[cid]',
                value: commentId // 该评论，即该叠楼在数据库中的ID
            }).appendTo('#commentForm');
        }
    });


    // 评论区提交评论点击事件
    $('#comments button').on('click', function(event) {
        // 阻止表单默认发送到服务器行为并发送Ajax请求
        event.preventDefault();
        $.ajax({
            url: '/admin/music/musicComment',
            type: 'POST',
            // 将第一第二隐藏表单中保存的音乐ID和用户ID值及评论内容发送给服务器
            data: {
                'comment[music]': $('#comments input[name="comment[music]"]').val(), // 音乐ID
                'comment[from]': $('#comments input[name="comment[from]"]').val(), // 回复人ID
                'comment[content]': $('#comments textarea').val(), // 评论内容
                // 若点击回复按钮对评论进行回复，就会生成两个隐藏的表单，分别有被回复人ID和点击该条评论的ID
                'comment[tid]': $('#toId').val(), // 被回复人ID
                'comment[cid]': $('#commentId').val() // 被点击评论的ID
            }
        }).done(function(results) {
            var data = results.data || {};
            // 如果是对评论进行回复
            if (data.reply.length) {
                var len = data.reply.length; // 回复评论人的条数
                $('#mediaBody').append('<div class="media"><div class="media-left"><img src="/libs/images/user/headImg.png" style="width: 30px; height: 30px;"/></div><div class="media-body"><h4  class="media-heading">' + data.reply[len - 1].from.name + '<span>&nbsp;回复&nbsp;</span>' + data.reply[len - 1].to.name + '</h4><p>' + data.reply[len - 1].content + '</p><span class="createAt">' + format(new Date()) + '</span>&nbsp;&nbsp;&nbsp;&nbsp;<a class="comment" href="#comments" data-cid=' + data._id + ' data-tid=' + data.reply[len - 1].to._id + '> 回复</a>&nbsp;|&nbsp;<a class="comment-del" href="javascript:;" data-cid=' + data._id + ' data-did=' + data.reply[len - 1]._id + '>删除</a></div></div>');
                // 如果是发表新评论
            } else {
                $('#mediaList').append('<li class="media"><div class="media-left"><img src="/libs/images/user/headImg.png" style="width: 40px; height: 40px;" /></div><div class="media-body"><h4 class="media-heading">' + data.from.name + '</h4><p>' + data.content + '</p><span class="createAt">' + format(new Date()) + '</span>&nbsp;&nbsp;&nbsp;&nbsp;<a class="comment" href="#comments" data-cid=' + data._id + ' data-tid=' + data.from._id + '> 回复</a>&nbsp;|&nbsp;<a class="comment-del" href="javascript:;" data-cid=' + data._id + '>删除</a></div><hr></li>');
            }

            $('#comments textarea').val(''); // 发表评论后清空评论框内容
            // 给叠楼回复内容完后要删除给叠楼楼主添加的ID值，方便下次点击其他叠楼楼主继续添加该ID
            $('#mediaBody').removeAttr('id');
            // 同样将叠楼评论中新建的两个隐藏表单清空，方便下次回复新内容时不会堆叠到此楼
            $('#commentForm input:gt(1)').remove();
        });
    });

    // 删除评论功能
    $('#mediaList').on('click', '.comment-del', function(event) {
        var $omediaBody = $(this).parent('.media-body'); // 获取点击删除a元素的父节点
        var cid = $(event.target).data('cid'); // 获取该删除评论的id
        // 如果点击的是叠楼中的回复评论还要获取该回复评论的自身id值
        var did = $(event.target).data('did');

        $.ajax({
            url: '/music/:id?cid=' + cid + '&did=' + did,
            type: 'DELETE',
        }).done(function(results) {
            if (results.success === 1) {
                // 获取.media-body的父节点并删除
                $omediaBody.parent().remove();
            }
        });
    });


    // format second to 00:00
    function secondToTime(second) {
        var add0 = function(num) {
            return num < 10 ? '0' + num : '' + num;
        };
        var min = parseInt(second / 60);
        var sec = parseInt(second - min * 60);
        return add0(min) + ':' + add0(sec);
    };
    //播放音乐与同步歌词
    $('audio')[0].volume = 0.2;
    $('audio').on('play', function(event) {
        var $this = $(this)
        var lrcIndex = 0
        var lrcTime = [];
        var lrcLine = [];
        var start = new Date().getTime();

        var $lrc = $('#lrc');
        var lrcs = $('.aplayer-lrc-content').html();
        var lines = lrcs.split(/\n/);
        var timeExp = /\[(\d{2}):(\d{2})\.(\d{3})]/;
        var lrcExp = /](.*)$/;
        var notLrcLineExp = /\[[A-Za-z]+:/;
        var html = '<div class="lyrics-container">';
        html += '<div class="lyrics-container2">'
        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].replace(/^\s+|\s+$/g, '');
            var oneTime = timeExp.exec(lines[i]);
            var oneLrc = lrcExp.exec(lines[i]);
            if (oneTime && oneLrc && !lrcExp.exec(oneLrc[1])) {
                lrcTime.push(parseInt(oneTime[1]) * 60 + parseInt(oneTime[2]) + parseInt(oneTime[3]) / 1000);

                lrcLine.push(oneLrc[1]);
            } else if (lines[i] && !notLrcLineExp.exec(lines[i])) {
                throw 'APlayer Error: lrc format error : should be like `[mm:ss.xx]lyric` : ' + lines[i];
            }
        }
        for (i = 0; i < lrcLine.length; i++) {
            html += '<p name='+ i +' class="lyrics" tag=' + lrcTime[i] + '>' + lrcLine[i] + '</p>';
        }
        html += '</div></div>';
        $lrc.html(html)
        var lastnum = $lrc.find('.lyrics').last();
        var timer = setInterval(function () {
        	if (!currentTime) {
    			var currentTime = $('audio')[0].currentTime;
            if (currentTime < lrcTime[lrcIndex] || currentTime >= lrcTime[lrcIndex + 1]) {
                $lrc.find('.lyrics').each(function(index, itme) {
                        if (currentTime >= $(this).attr('tag') && (!$(this).next().attr('tag') || currentTime < $(this).next().attr('tag'))) {
                            lrcIndex = index;
                            $(this).addClass('activated').siblings('.lyrics').removeClass('activated');;
                                if ($(this).prevAll('.lyrics').length > 4) {
                                    var dos = (-30*($(this).attr('name')-3))+'px'
                                    $('.lyrics-container2').css({
                                        'top': dos
                                    });
                            	}
                                
                                    if($(this).attr('name') === lastnum.attr('name')){
                                        var timer1 = setTimeout(function () {
                                            $('.lyrics-container2').css({top:0});
                                        }, 10000);
                                        }
                               
                                    
                            }    
                            });
                    }
                }
            },1000)
        if ($lrc.find('.lyrics').attr('name') === lastnum.attr('name')) {
            clearInterval(timer);
        }
        
        
    })

});
