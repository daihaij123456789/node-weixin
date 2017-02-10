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




    var ac = new(window.AudioContext || window.webkitAudioContext)();
    var analyser = ac.createAnalyser();
    var drawType = "lrc"; //歌词与动画切换
    var size = 32;
    analyser.fftSize = size*2;






    //播放音乐与动画
    $('#type').on('click', 'li', function(event) {
            var target = $(event.target)
            target.addClass('selected01').siblings('li').removeClass('selected01');
            drawType = target.attr('data-type');
     })
            /*/*function random(m, n) {
            return Math.round(Math.random() * (n - m) + m);
        }
/*        var xhr = new XMLHttpRequest();
        var Dots = [];*/


            /*if (drawType == "column") {
                var $lrc = $('#lrc');
                $lrc.empty();
                $lrc.html('<canvas id="canvas"></canvas>')
                var ctx = $('#canvas')[0].getContext('2d');
                var audio = document.getElementById('#audio-paly')
                var height = $lrc.height();
                var width = $lrc.width();
                canvas.height = height;
                canvas.width = width;
                
                var source = ca.createMediaElementSource(audio);
                var analyser = ac.createAnalyser();
                    source.connect(analyser);
                    analyser.connect(ac.destination);
                    audio.oncanplaythrough =  function draw() {
                        var cheight = canvas.height();
                        var cwidth = canvas.width();
                        var arr = new Uint8Array(256);
                        analyser.getByteFrequencyData(arr);
                        ctx.clearRect(0, 0, cwidth, cheight);
                        for (var i = 0; i < arr.length; i++) {
                                ctx.fillRect(i*3, cheight - arr[i], 2, cheight);
                            }
                        requestAnimationFrame(draw);
                    }
                xhr.open("GET", '/libs/media/music/1.mp3');
                xhr.responseType = "arraybuffer";

                xhr.onload = function() {
                    ac.decodeAudioData(xhr.response, function(buffer) {
                            var bs = ac.createBufferSource();
                            bs.buffer = buffer;
                            bs.connect(analyser);
                            var arr = new Uint8Array(analyser.frequencyBinCount);
                            analyser.getByteFrequencyData(arr);

                            var height = $lrc.height();
                            var width = $lrc.width();
                            $lrc.html('<canvas id="canvas"></canvas>')
                            var ctx = $('#canvas')[0].getContext('2d');
                            canvas.height = height;
                            canvas.width = width;
                            var cheight = canvas.height;
                            var cwidth = canvas.width;
                            ctx.clearRect(0, 0, cheight, cwidth);
                            for (var i = 0; i < arr.length; i++) {
                                ctx.fillRect(i*3, cheight - arr[i], 2, cheight);
                            }
                             ctx.fillStyle = 'red';
                             ctx.fillRect(5,10,50,100);
                            var w = width / size;
                            var cw = w * 0.6;
                            var capH = cw > 10 ? 10 : cw;
                            var cap = 10;
                            var line = ctx.createLinearGradient(0, 0, 0, height); //柱形渐变色
                            line.addColorStop(0, "red");
                            line.addColorStop(0.5, "yellow");
                            line.addColorStop(1, "green");

                            function resize() {
                                ctx.fillRect(w, height, cw, height)
                                for (var i = 0; i < size; i++) {
                                    var color = "rgba(" + random(0, 255) + "," + random(0, 255) + "," + random(0, 255) + ",0)";
                                    var h = arr[i] / 256 * height;
                                    ctx.fillRect(w * i, height - h, cw, h);
                                    ctx.fillRect(w * i, height - (cap + capH), cw, capH);
                                    cap--;
                                    if (cap < 0) {
                                        cap = 0;
                                    }
                                    if (h > 0 && cap < h + 40) {
                                        cap = h + 40 > height - capH ? height - capH : h + 40;
                                    }

                                }
                            }
                            resize();
                            window.onresize = resize;


                        },
                        function(err) {
                            console.log(err);
                        })
                }
                xhr.send();*/
       


//播放音乐与同步歌词

$('audio').on('play', function(event) {
    var target = $(event.target),
        _id = target.data('id'); // 获取点击的id值
    var $lrc = $('#lrc');
    var html = '';
    var start = new Date();
    if (drawType == "lrc") {
        $.ajax({
                url: '/musicPaly?id=' + _id,
                type: 'get',
                dataType: 'json',
                cache: true,
                crossDomain: true,
                success: function(data) {
                    var data = JSON.parse(data);
                    $lrc.empty();
                    html += '<div class="info">';
                    if ($(data).find('TITLE').length > 0) {
                        html += '<p class="music-title lyrics-title">歌曲：' + $(data).find('TITLE').text() + '</p>';
                    }
                    if ($(data).find('ALBUM').length > 0) {
                        html += '<p class="album lyrics-title">专辑：' + $(data).find('ALBUM').text() + '</p>';
                    }
                    if ($(data).find('ARTIST').length > 0) {
                        html += '<p class="artist lyrics-title">演唱：' + $(data).find('ARTIST').text() + '</p>';
                    }
                    html += '</div>';
                    html += '<div class="lyrics-container">'
                    html += '<div class="lyrics-container2">'
                    $(data).find('LRC').each(function() {
                        html += '<p class="lyrics" tag="' + $(this).attr('TAG') + '">' + $(this).text() + '</p>';
                    });
                    html += '</div></div>';
                    $lrc.html(html);

                }
            })
        var timer = setInterval(function() {
            var now = new Date();
            var elapsed = now - start;
            if ($lrc.find('.lyrics').length) {
                $lrc.find('.lyrics').each(function() {
                    var isOK = elapsed - $(this).attr('tag');
                    if (isOK < 13 && isOK > 0) {
                        $lrc.find('.lyrics').removeClass('activated');
                        $(this).addClass('activated');
                        if ($(this).prevAll('.lyrics').length > 3) {
                            $('.lyrics-container2').animate({
                                'top': '-=30px'
                            });
                            //console.log($(this).prevAll('.lyrics').length);
                        }
                    }
                });
            }
        }, 10);
    } else if (drawType == "column") {
        $lrc.empty();
        $lrc.html('<canvas id="canvas"></canvas>')
        var ctx = $('#canvas')[0].getContext('2d');
        var myAudio = document.getElementById('audio-paly');

        var height = $lrc.height();
        var width = $lrc.width();
        var w = width / size;
        var cw = w * 0.6;
        var capH = cw > 10 ? 10 : cw;
        var cap = 10;
        var line = ctx.createLinearGradient(0, 0, 0, height); //柱形渐变色
        line.addColorStop(0, "red");
        line.addColorStop(0.5, "yellow");
        line.addColorStop(1, "green");
        
        canvas.height = height;
        canvas.width = width;
             var source = ac.createMediaElementSource(myAudio);
            var analyser = ac.createAnalyser();
            source.connect(analyser);
            analyser.connect(ac.destination);
            draw()
        
        //var size = 32;
        //var analyser.fftSize=size*2;
        function draw(){
            var cheight = canvas.height;
            var cwidth = canvas.width; 
           
            //var w = cwidth/size*0.6
            var arr = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(arr);
            ctx.clearRect(0, 0, cwidth, cheight);
            for (var i = 0; i <size*2 ; i++) {
                var h=arr[i]/256*cheight;
                ctx.fillStyle=line;
                ctx.fillRect(w*i, cheight - h, cw, cheight);
            }
            requestAnimationFrame(draw);
        }
    }
})

});
