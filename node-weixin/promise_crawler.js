'use strict'
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var cheerio = require('cheerio');
var co = require('co');
var http = require('http')
let baseUrl = 'http://www.imooc.com/learn/';
let vids = [637]

// 爬取有用的信息
function filterCourse(ajaxData) {
    let $ = cheerio.load(ajaxData.html);

    let courseData = {
        courseTitle: $('.course-infos').find('h2').text(),
        watchedNumber: ajaxData.watchedNumber,
        chapterArr: []
    };
    let chapters = $('.chapter');
    chapters.each((index, el) => {
        let item = $(el)
        let chapterData = {
            chapterTitle: '',
            videos: []
        }
        chapterData.chapterTitle = item.find('strong').text().replace(/\s*\r\n\s*/g, '')
        let lis = item.find('.video').children('li')
        lis.each((index, ele) => {
            let self = $(ele)
            let video = {
                vTitle: '',
                id: 0
            }
            video.vTitle = self.find('.J-media-item').text().replace(/\s*\r\n\s*/g, '')
            video.id = self.attr('data-media-id')
            chapterData.videos.push(video)
        })
        courseData.chapterArr.push(chapterData)
    })
    return courseData
}

// 输出到console.log
function printCourse(courseArr) {
    courseArr.forEach((courseData, index) => {
        console.log(`多少人学过：${courseData.watchedNumber}`)
            // if (index === courseArr.length - 1) {
            //     console.log('\n')
            // }
    })
    courseArr.forEach((courseData) => {
        console.log(`\n《课程：${courseData.courseTitle}》`)
        courseData.chapterArr.forEach((chapter) => {
            console.log(chapter.chapterTitle)
            chapter.videos.forEach((item) => {
                console.log(`【${item.id}】${item.vTitle}`)
            })
        })
    })
}

function getpageAsync(url) {
    return new Promise((resolve, reject)=> {
        let ajaxData = {
            watchedNumber: 0,
            html: '',
        };
        console.log(`正在爬取……${url}`)
            // ajax get观看人数
        let numbers = new Promise((resolve, reject) => {
            let vid = url.match(/[^http://www.imooc.com/learn/]\d*/);
            let headers = {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Encoding': 'gzip, deflate, sdch',
                'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Cookie': 'imooc_uuid=3a6a7b23-a1cb-4e58-881f-6f01b389d10d; imooc_isnew_ct=1485182108; loginstate=1; apsid=g4NDgzNTVlZDhlZWFkZjBiMDU1MDA2MTJhNmI2NTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMzczNDU0NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB3aW41ZG9AcXEuY29tAAAAAAAAAAAAAAAAAAAAAAAAADgzMzg3YzIxYmRkMjNmY2FkZTgwZWFmN2JlZjVjYmIxExWGWBMVhlg%3DYT; last_login_username=win5do%40qq.com; channel=491b6f5ab9637e8f6dffbbdd8806db9b_phpkecheng; PHPSESSID=erl04j809ba73030p4nj47vmd0; imooc_isnew=2; IMCDNS=0; Hm_lvt_f0cfcccd7b1393990c78efdeebff3968=1485426499,1485446171,1485502103,1485525699; Hm_lpvt_f0cfcccd7b1393990c78efdeebff3968=1485525715; cvde=588b52c05f023-9',
                'Host': 'www.imooc.com',
                'Pragma': 'no-cache',
                'Referer': url,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
            let options = {
                hostname: 'www.imooc.com',
                path: `/course/AjaxCourseMembers?ids=${vid}`,
                method: 'GET',
                headers,
            }
            http.get(options, (res) => {
                    let rawData = '';
                    res.on('data', (chunk) => {
                        rawData += chunk;
                    })
                    res.on('end', () => {
                        ajaxData.watchedNumber = parseInt(JSON.parse(rawData).data[0].numbers);
                        resolve(ajaxData);
                    }).on('error', (e) => {
                        reject(e)
                    })
                })
        })
        request({ method: 'GET', url: url, json: true }).then((response)=> {
                ajaxData.html = response.body;
                resolve(ajaxData)
            })
            .catch((err)=> {
                reject(err)
            })
    })

}
// getpageAsync返回的5个promise对象组成的数组
let pagesArr = vids.map((vid) => {
    let url = `${baseUrl}${vid}`
    return getpageAsync(url);
})

Promise
    .all(pagesArr)
    .then((pages) => {
        let courseArr = pages.map((ajaxData) => {
            return filterCourse(ajaxData);
        });
        courseArr.sort((a, b) => {
            a = a.watchedNumber;
            b = b.watchedNumber;
            return b - a;
        })
        printCourse(courseArr);
    })
    .catch((e) => {
        console.log(`出错：${e}`)
    })
