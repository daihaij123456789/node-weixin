var Movie = require('../models/movie/movie')
var co = require('co');
var koa_request = require('koa-request')
var Promise = require('bluebird');
var _ = require('lodash')
var request = Promise.promisify(require('request'));
var Category = require('../models/movie/movie_category')
    //movie首页
exports.findAll = co.wrap(function* () {
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
exports.searchByCategory = co.wrap(function* (catId) {
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
exports.searchByName = co.wrap(function* (q) {
    var movies = yield Movie
        .find({ title: new RegExp(q + '.*', 'i') })
        .exec()
    return movies

})

// searchById 搜索页面
exports.searchById = co.wrap(function* (id) {
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
    request(options).then(function (response) {
        var data = response.body;
        console.log(data.countries);
        _.extend(movie, {
            country: data.countries[0] || '',
            language: data.language,
            summary: data.summary
        })
        var genres = movie.genres;
        if (genres && genres.length > 0) {
            console.log(movie);
            var cateArray = [];
            genres.forEach(function (genre) {
                cateArray.push(function* () {
                    var cat = yield Category.findOne({name: genre }).exce();
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
                        yield movie.save()
                    }
                })
            })
            co(function* () {
              yield cateArray
              console.log('测试');
            })
        } else {
            movie.save()
        }
    })
}
// searchByDouban 搜索页面
exports.searchByDouban = co.wrap(function* (q) {
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
        subjects.forEach(function(item) {
            queryArray.push(function* () {
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
        })
        yield queryArray
        movies.forEach(function(movie) {
            updateMovies(movie)
        })   
    }
    return movies
})
