'use strict'
var Music = require('../models/music/music')
var co = require('co');
var koa_request = require('koa-request')
var Promise = require('bluebird');
var _ = require('lodash')
var request = Promise.promisify(require('request'));
var Category = require('../models/music/music_category')
    //music首页
exports.findAll = co.wrap(function*() {
    var categories = yield Category
        .find({})
        .populate({
            path: 'musics',
            select: 'title poster',
            options: { limit: 6 }
        })
        .exec()
    return categories
})
// searchByCategory 搜索页面
exports.searchByCategory = co.wrap(function*(catId) {
    var categories = yield Category
        .find({})
        .populate({
            path: 'musics',
            select: 'title poster',
            options: { limit: 6 }
        })
        .exec()
    return categories
})

// searchByName 搜索页面
exports.searchByName = co.wrap(function*(q) {
    var musics = yield Music
        .find({ title: new RegExp(q + '.*', 'i') })
        .exec()
    return musics

})
// 最热最冷搜索页面
exports.findHotMusics = co.wrap(function*(hot, count) {
    var musics = yield Music
        .find({})
        .sort({'pv':hot})
        .limit(count)
        .exec()
    return musics

})
// 分类搜索页面
exports.findMusicsByCate = co.wrap(function*(cat) {
    var category = yield Category
        .findOne({name:cat})
        .populate({
            path:'musics',
            select:'title poster _id'
        })
        .exec();
    return category

})

// searchById 搜索页面
exports.searchById = co.wrap(function*(id) {
    var music = yield Music
        .findOne({ _id: id })
        .exec()
    return music
})
/*
function updateMovies(music) {
    var options = {
        url: 'http://api.douban.com/v2/music/subject/' + music.doubanId,
        json: true,
    }
    request(options).then(function(response) {
        var data = response.body;
        if (data.countries) {
            var country = data.countries[0]
        }
        if (data.rating) {
            var rating = data.rating.average; // 豆瓣评分
        }
        if (data.casts) {
            var castNames = '';
            data.casts.forEach(function(item, index) {
                castNames += item.name;
                // 最后一个主演不添加'/'
                if (index < data.casts.length - 1) {
                    castNames += '/';
                }
            });
        }
        _.extend(movie, {
            country: country || '',
            summary: data.summary || '',
            rating: rating || '',
            casts: castNames || ''
        })
        var genres = movie.genres;
        if (genres && genres.length > 0) {
            var cateArray = [];
            genres.forEach(function(genre) {
                cateArray.push(function*() {
                    var cat = yield Category.findOne({ name: genre }).exce();
                    if (cat) {
                        cat.movies.push(movie._id);
                        yield cat.save()
                        yield movie.save()
                    } else {
                        cat = new Category({
                            name: genre,
                            movies: [movie._id]
                        })
                        yield cat.save();
                        movie.category = cat._id;
                        yield movie.save()
                    }
                })
            })
            co.wrap(function*() {
                yield cateArray
            })
        } else {
            movie.save()
        }
    })
}*/
// searchByDouban 搜索页面
exports.searchByDouban = co.wrap(function*(q) {
    var options = {
        url: 'https://api.douban.com/v2/music/search?q='
    }
    options.url += encodeURIComponent(q)
    var response = yield koa_request(options);
    var data = JSON.parse(response.body);
    var musics = []
    var newMusics = [];
    if (data && data.musics) {
        musics = data.musics
    }
    if (musics.length > 0) {
        var queryArray = [];
        musics.forEach(function(item, index) {
            if (index < 5) {
                queryArray.push(function*() {
                    var music = yield Music.findOne({ doubanId: item.id });
                    if (music) {
                        newMusics.push(music)
                    } else {
                    	if (data.rating) {
			                var rating = data.rating.average; // 豆瓣评分
			            }
                    	if (data.attrs) {
			            	var media = data.attrs.media;
			            	var pubdate = data.attrs.pubdate;
			            	var version = data.attrs.version;
			            	var singer = data.attrs.singer;
			            	var publisher = data.attrs.publisher;
			            	var summary = data.attrs.tracks;
			            };
                        music = new Music({
                            title: item.title || '',
                            doubanId: item.id,
                            image: item.image || '',
			                media: media || '',
			                summary: summary || '',
			                rating: rating || '',
			                version: version || '',
			                singer:singer|| '',
			                publisher:publisher|| '',

                        })
                        music = yield music.save();
                        newMusics.push(music);
                    }
                })
            }

        })
        yield queryArray

    }
    return newMusics
})