'use strict'
module.exports = {
    'button': [{
        'name': '大海电影',
        'sub_button': [{
            'type': 'click',
            'name': '本周最热',
            'key': 'movie_hot'
        }, {
            'type': 'click',
            'name': '最冷的',
            'key': 'movie_cold'
        },{
            'name': '正在上映',
            'type': 'click',
            'key': 'movie_action'
        },{
            'name': '即将上映',
            'type': 'click',
            'key': 'movie_car'
        },{
            'name': '本周口碑榜',
            'type': 'click',
            'key': 'movie_k'
        }]
    }, {
        'name': '大海音乐',
        'sub_button': [{
            'type': 'click',
            'name': '本周单曲榜最热',
            'key': 'music_hot'
        }, {
            'type': 'click',
            'name': '最冷的',
            'key': 'music_cold'
        },{
            'type': 'click',
            'name': '编辑推荐',
            'key': 'music_b',
        },{
            'name': '不灭的经典',
            'type': 'click',
            'key': 'music_car'
        },{
            'name': '豆瓣音乐250',
            'type': 'click',
            'key': 'music_duo'
        }
        ]
    },{ 
            'type': 'click',
            'name': '帮助',
            'key': 'help',
        }]
}
