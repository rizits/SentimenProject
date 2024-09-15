"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var cheerio = require("cheerio");
var path = require("path");
var fs = require("fs");
var puppeteer_1 = require("puppeteer");
var csv_writer_1 = require("csv-writer");
var keywords = [
    'pinjaman pemerintah', 'surat utang', 'investor asing', 'sbn ritel', 'sukuk', 'surat berharga negara',
    'kreditur pemerintah', 'ori', 'pasar obligasi', 'obligasi negara', 'inflasi', 'suku bunga', 'sun', 'jatuh tempo',
    'nilai tukar', 'kepemilikan asing', 'yield', 'ust', 'us treasury', 'surat utang negara', 'obligasi pemerintah',
    'obligasi ritel indonesia', 'kebijakan moneter', 'likuiditas pasar', 'imbal hasil', 'pasar global', 'rating kredit',
    'sentimen pasar', 'pasar sekunder', 'Obligasi Negara', 'Surat Utang Negara', 'Pergerakan Yield', 'Analisis Sentimen',
    'Yield Obligasi', 'Pasar Obligasi', 'Kinerja Obligasi', 'Tren Yield', 'Pengaruh Makroekonomi', 'Kondisi Ekonomi',
    'Suku Bunga', 'Kebijakan Moneter', 'Inflasi', 'Pasar Keuangan', 'Volatilitas Pasar', 'Pergerakan Suku Bunga',
    'Imbal Hasil', 'Krisis Keuangan', 'Pemerintah Indonesia', 'Sentimen Investor'
];
function scrapeArticlesForKeywords() {
    return __awaiter(this, void 0, void 0, function () {
        var allArticles, seenLinks, _i, keywords_1, keyword, articlesForKeyword, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Starting the scraping process...');
                    allArticles = [];
                    seenLinks = new Set();
                    _i = 0, keywords_1 = keywords;
                    _a.label = 1;
                case 1:
                    if (!(_i < keywords_1.length)) return [3 /*break*/, 6];
                    keyword = keywords_1[_i];
                    console.log("Scraping articles for keyword: ".concat(keyword));
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, scrapeArticlesFromTagPage(keyword, seenLinks)];
                case 3:
                    articlesForKeyword = _a.sent();
                    if (articlesForKeyword.length > 0) {
                        allArticles.push.apply(allArticles, articlesForKeyword);
                        console.log("Found ".concat(articlesForKeyword.length, " articles for keyword \"").concat(keyword, "\"."));
                    }
                    else {
                        console.log("No articles found for keyword \"".concat(keyword, "\"."));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error while scraping articles for keyword \"".concat(keyword, "\":"), error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    if (allArticles.length > 0) {
                        saveToCSV(allArticles); // Save all articles to one CSV file
                    }
                    else {
                        console.log('No articles found for any keywords.');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function scrapeArticlesFromTagPage(keyword, seenLinks) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, url, articles, loadMoreVisible, lastArticleCount, newArticles, _i, newArticles_1, article, normalizedLink, articleDetails;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, puppeteer_1.default.launch({ headless: true })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _a.sent();
                    url = "https://www.viva.co.id/search?q=".concat(encodeURIComponent(keyword));
                    return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle2' })];
                case 3:
                    _a.sent();
                    articles = [];
                    loadMoreVisible = true;
                    lastArticleCount = 0;
                    _a.label = 4;
                case 4:
                    if (!loadMoreVisible) return [3 /*break*/, 13];
                    return [4 /*yield*/, page.evaluate(function () {
                            var items = document.querySelectorAll('.article-list-row');
                            var articles = [];
                            items.forEach(function (item) {
                                var titleElement = item.querySelector('.article-list-title');
                                var linkElement = item.querySelector('.article-list-title');
                                var dateElement = item.querySelector('.article-list-date');
                                var title = titleElement ? titleElement.innerText.trim() : '';
                                var link = linkElement ? linkElement.href : '';
                                var publishTime = dateElement ? dateElement.innerText.trim() : '';
                                articles.push({ title: title, link: link, publishTime: publishTime });
                            });
                            return articles;
                        })];
                case 5:
                    newArticles = _a.sent();
                    if (newArticles.length <= lastArticleCount) {
                        console.log("No new articles loaded, stopping...");
                        return [3 /*break*/, 13];
                    }
                    lastArticleCount = newArticles.length;
                    _i = 0, newArticles_1 = newArticles;
                    _a.label = 6;
                case 6:
                    if (!(_i < newArticles_1.length)) return [3 /*break*/, 9];
                    article = newArticles_1[_i];
                    normalizedLink = new URL(article.link, 'https://www.viva.co.id').href;
                    if (seenLinks.has(normalizedLink)) {
                        console.log("Skipping already seen article: ".concat(article.title));
                        return [3 /*break*/, 8];
                    }
                    seenLinks.add(normalizedLink);
                    return [4 /*yield*/, scrapeArticleContent(normalizedLink)];
                case 7:
                    articleDetails = _a.sent();
                    articles.push({
                        title: article.title,
                        scrappingDate: new Date().toISOString(),
                        articleDate: article.publishTime,
                        author: articleDetails.author,
                        link: normalizedLink,
                        content: articleDetails.content
                    });
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9: return [4 /*yield*/, page.evaluate(function () {
                        var loadMoreButton = document.querySelector('#load-more-btn');
                        if (loadMoreButton && loadMoreButton.style.display !== 'none') {
                            loadMoreButton.click();
                            return true;
                        }
                        return false;
                    })];
                case 10:
                    loadMoreVisible = _a.sent();
                    if (!loadMoreVisible) return [3 /*break*/, 12];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 11:
                    _a.sent(); // Wait for the new articles to load
                    _a.label = 12;
                case 12: return [3 /*break*/, 4];
                case 13: return [4 /*yield*/, browser.close()];
                case 14:
                    _a.sent();
                    return [2 /*return*/, articles];
            }
        });
    });
}
function scrapeArticleContent(url) {
    return __awaiter(this, void 0, void 0, function () {
        var data, $, content, author, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log("Fetching content from: ".concat(url));
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 1:
                    data = (_a.sent()).data;
                    $ = cheerio.load(data);
                    content = $('.main-content-detail p').text().trim();
                    author = $('.main-content-author a').text().trim();
                    return [2 /*return*/, { content: content, author: author }];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error fetching article content from ".concat(url, ":"), error_2);
                    return [2 /*return*/, { content: '', author: '' }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function saveToCSV(articles) {
    if (articles.length === 0) {
        console.log("No articles found to save.");
        return;
    }
    var directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    var csvPath = path.join(directory, "all_keywords_scraped_articles.csv");
    var csv = (0, csv_writer_1.createObjectCsvWriter)({
        path: csvPath,
        header: [
            { id: 'title', title: 'Title' },
            { id: 'scrappingDate', title: 'Scrapping Date' },
            { id: 'articleDate', title: 'Article Date' },
            { id: 'author', title: 'Author' },
            { id: 'link', title: 'Link' },
            { id: 'content', title: 'Content' }
        ]
    });
    csv.writeRecords(articles)
        .then(function () {
        console.log("Articles successfully saved to ".concat(csvPath));
    })
        .catch(function (error) {
        console.error('Error writing to CSV:', error);
    });
}
// Start the scraping process
scrapeArticlesForKeywords().then(function () {
    console.log('Scraping process completed.');
}).catch(function (error) {
    console.error('Error during the scraping process:', error);
});
