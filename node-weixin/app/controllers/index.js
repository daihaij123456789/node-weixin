var Movie = require('../api/movie_index')
//movie首页
exports.index = co.wrap(function(ctx, next) {
      var categories = yield Movie.findAll()
      yield ctx.render('pages/index', {
        title: 'Dahai1204jhy 电影首页',
        categories: categories
      })
})

// search 搜索页面
exports.search = co.wrap(function(ctx, next) {
  var catId = ctx.query.cat
  var q = ctx.query.q
  var page = parseInt(ctx.query.p, 10) || 0
  var count = 2
  var index = page * count

  if (catId) {
        var categories = yield Movie.searchByCategory(catId)
        var category = categories[0] || {}
        var movies = category.movies || []
        var results = movies.slice(index, index + count)

        yield ctx.render('pages/results', {
          title: '电影结果列表页面',
          keyword: category.name,
          currentPage: (page + 1),
          query: 'cat=' + catId,
          totalPage: Math.ceil(movies.length / count),
          movies: results
        })
  }
  else {
    var movies = yield Movie.searchByName(q)
    
        var results = movies.slice(index, index + count)

        yield ctx.render('pages/results', {
          title: '电影结果列表页面',
          keyword: q,
          currentPage: (page + 1),
          query: 'q=' + q,
          totalPage: Math.ceil(movies.length / count),
          movies: results
        })
  }
})