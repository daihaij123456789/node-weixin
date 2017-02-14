'use strict'
var Movie = require('../models/movie/movie')
var co = require('co');
var koa_request = require('koa-request')
var Promise = require('bluebird');
var _ = require('lodash')
var request = Promise.promisify(require('request'));
var Category = require('../models/movie/movie_category')
    //movie首页
exports.findAll = co.wrap(function*() {
    var categories = yield Category
        .find({})
        .populate({
            path: 'movies',
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
            path: 'movies',
            select: 'title poster',
            options: { limit: 6 }
        })
        .exec()
    return categories
})

// searchByName 搜索页面
exports.searchByName = co.wrap(function*(q) {
    var movies = yield Movie
        .find({ title: new RegExp(q + '.*', 'i') })
        .exec()
    return movies

})
// 最热最冷搜索页面
exports.findHotMovies = co.wrap(function*(hot, count) {
    var movies = yield Movie
        .find({})
        .sort({'pv':hot})
        .limit(count)
        .exec()
    return movies

})
// 分类搜索页面
exports.findMoviesByCate = co.wrap(function*(cat) {
    var category = yield Category
        .findOne({name:cat})
        .populate({
            path:'movies',
            select:'title poster _id'
        })
        .exec();
    return category

})

// searchById 搜索页面
exports.searchById = co.wrap(function*(id) {
    var movie = yield Movie
        .findOne({ _id: id })
        .exec()
    return movie

})

function updateMovies(movie) {
    var options = {
        url: 'http://api.douban.com/v2/movie/subject/' + movie.doubanId,
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
}
// searchByDouban 搜索页面
exports.searchByDouban = co.wrap(function*(q) {
    var options = {
        url: 'http://api.douban.com/v2/movie/search?q='
    }
    options.url += encodeURIComponent(q)
    var response = yield koa_request(options);
    var data = JSON.parse(response.body);
    var subjects = [];
    var movies = []
    if (data && data.subjects) {
        subjects = data.subjects
    }
    if (subjects.length > 0) {
        var queryArray = [];
        subjects.forEach(function(item, index) {
            if (index < 6) {
                queryArray.push(function*() {
                    var movie = yield Movie.findOne({ doubanId: item.id });
                    if (movie) {
                        movies.push(movie)
                    } else {
                        var directors = item.directors || [];
                        var director = directors[0] || {};
                        movie = new Movie({
                            director: director.name || '',
                            title: item.title || '',
                            doubanId: item.id,
                            poster: item.images.large || '',
                            year: item.year || '',
                            genres: item.genres || [],

                        })
                        movie = yield movie.save();
                        movies.push(movie)
                    }
                })
            }

        })
        yield queryArray

    }
    movies.forEach(function(movie) {
        var options = {
            url: 'http://api.douban.com/v2/movie/subject/' + movie.doubanId,
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
                        } else {
                            cat = new Category({
                                name: genre,
                                movies: [movie._id]
                            })
                            cat = yield cat.save();
                            movie.category = cat._id;
                        }
                    })
                })
                co.wrap(function*() {
                    yield cateArray
                })
            }
           movie.save()
        })
    })
    return movies
})
