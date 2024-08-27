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
var csvWriter = require("csv-writer");
var keywords = [
    'pinjaman pemerintah', 'surat utang', 'investor asing', 'sbn ritel', 'sukuk', 'surat berharga negara',
    // ... other keywords
];
var maxPages = 2;
function scrapeArticlesForKeywords() {
    return __awaiter(this, void 0, void 0, function () {
        var allArticles, _i, keywords_1, keyword, articlesForKeyword;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allArticles = [];
                    _i = 0, keywords_1 = keywords;
                    _a.label = 1;
                case 1:
                    if (!(_i < keywords_1.length)) return [3 /*break*/, 4];
                    keyword = keywords_1[_i];
                    console.log("Scraping articles for keyword: ".concat(keyword));
                    return [4 /*yield*/, scrapeArticlesFromTagPage(keyword)];
                case 2:
                    articlesForKeyword = _a.sent();
                    allArticles.push.apply(allArticles, articlesForKeyword);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    saveToCSV(allArticles);
                    return [2 /*return*/];
            }
        });
    });
}
function scrapeArticlesFromTagPage(keyword) {
    return __awaiter(this, void 0, void 0, function () {
        var pageNumber, morePages, seenLinks, articles, formattedKeyword, url, data, $, articleElements, newArticleFound, i, element, title, link, fullLink, _a, content, author, date, error_1, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    pageNumber = 0;
                    morePages = true;
                    seenLinks = new Set();
                    articles = [];
                    _b.label = 1;
                case 1:
                    if (!morePages) return [3 /*break*/, 12];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 10, , 11]);
                    formattedKeyword = encodeURIComponent(keyword).replace(/%20/g, '%2520');
                    url = "https://katadata.co.id/search/news/".concat(formattedKeyword, "/-/-/-/-/-/-/").concat(pageNumber);
                    console.log("Scraping URL: ".concat(url));
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 3:
                    data = (_b.sent()).data;
                    $ = cheerio.load(data);
                    articleElements = $('article.article--berita.d-flex');
                    newArticleFound = false;
                    i = 0;
                    _b.label = 4;
                case 4:
                    if (!(i < articleElements.length)) return [3 /*break*/, 9];
                    element = articleElements[i];
                    title = $(element).find('h3.content-title.content-title--list.mb-3').text().trim();
                    link = $(element).find('a').attr('href') || '';
                    if (!(title && link)) return [3 /*break*/, 8];
                    fullLink = link.startsWith('http') ? link : "https://katadata.co.id".concat(link);
                    if (seenLinks.has(fullLink)) {
                        console.log("Skipping already seen article: ".concat(title));
                        return [3 /*break*/, 8];
                    }
                    console.log("Fetching article: ".concat(title));
                    seenLinks.add(fullLink);
                    newArticleFound = true;
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, scrapeArticleContent(fullLink)];
                case 6:
                    _a = _b.sent(), content = _a.content, author = _a.author, date = _a.date;
                    articles.push({
                        title: title,
                        scrappingDate: new Date().toISOString(),
                        articleDate: date || '',
                        author: author || '',
                        link: fullLink,
                        content: content || ''
                    });
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    console.error("Error fetching article content from ".concat(fullLink, ":"), error_1);
                    return [3 /*break*/, 8];
                case 8:
                    i++;
                    return [3 /*break*/, 4];
                case 9:
                    if (!newArticleFound) {
                        console.log("No new articles found for keyword \"".concat(keyword, "\" at page ").concat(pageNumber, ". Stopping..."));
                        morePages = false;
                    }
                    pageNumber += 10; // Increment by 10 for the next page
                    if (pageNumber >= maxPages * 10) {
                        console.log("Maximum pages reached for keyword \"".concat(keyword, "\". Stopping..."));
                        morePages = false;
                    }
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _b.sent();
                    console.error("Error scraping Katadata for keyword \"".concat(keyword, "\" on page ").concat(pageNumber, ": ").concat(error_2));
                    morePages = false;
                    return [3 /*break*/, 11];
                case 11: return [3 /*break*/, 1];
                case 12: return [2 /*return*/, articles];
            }
        });
    });
}
function scrapeArticleContent(url) {
    return __awaiter(this, void 0, void 0, function () {
        var data, $_1, paragraphs, content, author, date, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 1:
                    data = (_a.sent()).data;
                    $_1 = cheerio.load(data);
                    paragraphs = $_1('.detail-body.mb-4 p').map(function (i, el) {
                        return $_1(el).text().trim();
                    }).get();
                    content = paragraphs.join('\n');
                    author = $_1('.detail-author-name a').text().trim();
                    date = $_1('.detail-date.text-gray').text().trim();
                    return [2 /*return*/, { content: content, author: author, date: date }];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error fetching article content from ".concat(url, ":"), error_3);
                    return [2 /*return*/, { content: '', author: '', date: '' }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function saveToCSV(articles) {
    if (articles.length === 0) {
        console.log("No articles found.");
        return;
    }
    var directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    var csvPath = path.join(directory, "all_keywords_scraped_articles.csv");
    var createCsvWriter = csvWriter.createObjectCsvWriter;
    var csv = createCsvWriter({
        path: csvPath,
        header: [
            { id: 'title', title: 'Title' },
            { id: 'scrappingDate', title: 'Scrapping Date' },
            { id: 'articleDate', title: 'Article Date' },
            { id: 'author', title: 'Author' },
            { id: 'link', title: 'Link' },
            { id: 'content', title: 'Content' }
        ],
        fieldDelimiter: ';',
    });
    csv.writeRecords(articles)
        .then(function () {
        console.log("Articles have been successfully saved to ".concat(csvPath));
    })
        .catch(function (error) {
        console.error('Error writing CSV:', error);
    });
}
scrapeArticlesForKeywords().then(function () {
    console.log('Scraping finished.');
}).catch(function (error) {
    console.error(error);
});
