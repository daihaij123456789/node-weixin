wx.config({
    debug: false,
    appId: 'wx9226474d248fd396',
    timestamp: '{#timestamp}',
    nonceStr: '{#noncestr}',
    signature: '{#signature}',
    jsApiList: ['startRecord', 'stopRecord', 'onVoiceRecordEnd', 'translateVoice', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone', 'previewImages']
});
wx.ready(function() {
    wx.checkJsApi({
        jsApiList: ['onVoiceRecordEnd'],
        success: function(res) {
            console.log(res)
        }
    });
    var shareContent = {
        title: '搜搜',
        desc: '我搜出来了',
        link: 'http://baidu.com/',
        imgUrl: '',
        type: 'link',
        dataUrl: '',
        success: function() {
            window.alert('分享成功')
        },
        cancel: function() {
            window.alert('取消分享')
        }
    }
    var slides;
    wx.onMenuShareAppMessage(shareContent);
    var isRecording = false;
    $('#poster').on('tap', function() {
        console.log(slides)
        wx.previewImage(slides);
    })
    $('h1').on('tap', function() {
        if (!isRecording) {
            isRecording = true
            wx.startRecord({
                cancel: function() {
                    window.alert('你点击取消，不搜索呢')
                }
            });
            return
        }
        isRecording = false
        wx.stopRecord({
            success: function(res) {
                var localId = res.localId;
                wx.translateVoice({
                    localId: localId,
                    isShowProgressTips: 1,
                    success: function(res) {
                        var reslut = res.translateResult;
                        $.ajax({
                            url: 'http://api.douban.com/v2/movie/search?q=' + reslut,
                            type: 'get',
                            dataType: 'jsonp',
                            jsonp: 'callback',
                            success: function(data) {
                                var subjects = data.subjects[0]
                                $('#title').html(subjects.title);
                                $('#directors').html(subjects.directors[0].name);
                                $('#year').html(subjects.year);
                                $('#poster').html('<img src="' + subjects.images.large + '"></img>');
                                shareContent = {
                                    title: subjects.title,
                                    desc: '我搜出来了' + subjects.title,
                                    link: 'http://baidu.com/',
                                    imgUrl: subjects.images.large,
                                    type: 'link',
                                    dataUrl: '',
                                    success: function() {
                                        window.alert('分享成功,yeah!!!!')
                                    },
                                    cancel: function() {
                                        window.alert('取消分享,no!!!!')
                                    }
                                }
                                slides = {
                                    current: subjects.images.large,
                                    urls: [subjects.images.large]
                                }
                                data.subjects.forEach(function(item, index) {
                                    if (index < 5) {
                                        slides.urls.push(item.images.large)
                                    }
                                })
                                wx.onMenuShareAppMessage(shareContent);
                            }
                        })
                    }
                });
            }
        });
    })
});
