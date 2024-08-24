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
var fs = require("fs");
var path = require("path");
// List of keywords to search
var keywords = [
    'rating kredit', 'sentimen pasar', 'pasar sekunder', 'Obligasi Negara',
    'Surat Utang Negara', 'Pergerakan Yield', 'Analisis Sentimen', 'Yield Obligasi',
    'Pasar Obligasi', 'Kinerja Obligasi', 'Tren Yield', 'Pengaruh Makroekonomi',
    'Kondisi Ekonomi', 'Suku Bunga', 'Kebijakan Moneter', 'Inflasi',
    'Pasar Keuangan', 'Volatilitas Pasar', 'Pergerakan Suku Bunga',
    'Imbal Hasil', 'Krisis Keuangan', 'Pemerintah Indonesia', 'Sentimen Investor'
];
// Maximum number of pages to scrape for each keyword
var maxPages = 10;
// Create the output directory if it doesn't exist
var outputDir = path.join(__dirname, 'scraped_articles');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
// Function to scrape the details of a single article
function scrapeArticleDetails(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response, $, title, scrappingDate, articleDate, author, content, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 1:
                    response = _a.sent();
                    $ = cheerio.load(response.data);
                    title = $('h1').text().trim();
                    scrappingDate = new Date().toISOString();
                    articleDate = $('div.text-cnn_grey.text-sm.mb-4').text().trim();
                    author = $('div.text-cnn_black_light3.text-sm.mb-2.5').text().split('|')[0].trim();
                    content = $('div.detail-text').text().trim();
                    return [2 /*return*/, {
                            Title: title,
                            ScrappingDate: scrappingDate,
                            ArticleDate: articleDate,
                            Author: author,
                            Link: url,
                            Content: content
                        }];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error scraping article details from ".concat(url, ":"), error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Function to scrape articles from search results pages
function scrapeCNNArticles(keyword, maxPages) {
    return __awaiter(this, void 0, void 0, function () {
        var baseUrl, articles, _loop_1, page;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    baseUrl = 'https://www.cnnindonesia.com/search/';
                    articles = [];
                    _loop_1 = function (page) {
                        var response, $_1, articleLinks, _i, articleLinks_1, articleUrl, articleDetails, error_2;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 6, , 7]);
                                    return [4 /*yield*/, axios_1.default.get("".concat(baseUrl, "?query=").concat(encodeURIComponent(keyword), "&page=").concat(page))];
                                case 1:
                                    response = _b.sent();
                                    $_1 = cheerio.load(response.data);
                                    articleLinks = $_1('div.flex.flex-col.gap-5 article a[href]').map(function (_, element) {
                                        return $_1(element).attr('href');
                                    }).get();
                                    _i = 0, articleLinks_1 = articleLinks;
                                    _b.label = 2;
                                case 2:
                                    if (!(_i < articleLinks_1.length)) return [3 /*break*/, 5];
                                    articleUrl = articleLinks_1[_i];
                                    return [4 /*yield*/, scrapeArticleDetails(articleUrl)];
                                case 3:
                                    articleDetails = _b.sent();
                                    if (articleDetails) {
                                        articles.push(articleDetails);
                                    }
                                    _b.label = 4;
                                case 4:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 5: return [3 /*break*/, 7];
                                case 6:
                                    error_2 = _b.sent();
                                    console.error("Error scraping page ".concat(page, " for keyword \"").concat(keyword, "\":"), error_2);
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    };
                    page = 1;
                    _a.label = 1;
                case 1:
                    if (!(page <= maxPages)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(page)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    page++;
                    return [3 /*break*/, 1];
                case 4:
                    if (articles.length > 0) {
                        saveToCSV(articles, keyword);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Function to save articles data to a CSV file
function saveToCSV(data, keyword) {
    var sanitizedKeyword = keyword.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    var csvFilePath = path.join(outputDir, "".concat(sanitizedKeyword, "_scraped_articles.csv"));
    var headers = 'Title,Scrapping Date,Article Date,Author,Link,Content\n';
    var rows = data.map(function (article) { return ("\"".concat(article.Title, "\",\"").concat(article.ScrappingDate, "\",\"").concat(article.ArticleDate, "\",\"").concat(article.Author, "\",\"").concat(article.Link, "\",\"").concat(article.Content.replace(/"/g, '""'), "\"\n")); }).join('');
    fs.writeFileSync(csvFilePath, headers + rows, 'utf-8');
    console.log("Articles for keyword \"".concat(keyword, "\" saved to ").concat(csvFilePath));
    // Log the titles of the scraped articles
    var logFilePath = path.join(outputDir, 'scraping_log.txt');
    var logEntries = data.map(function (article) { return "Keyword: ".concat(keyword, ", Title: ").concat(article.Title); }).join('\n') + '\n';
    fs.appendFileSync(logFilePath, logEntries, 'utf-8');
}
// Start scraping for each keyword
function startScraping() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, keywords_1, keyword;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, keywords_1 = keywords;
                    _a.label = 1;
                case 1:
                    if (!(_i < keywords_1.length)) return [3 /*break*/, 4];
                    keyword = keywords_1[_i];
                    console.log("Scraping articles for keyword: ".concat(keyword));
                    return [4 /*yield*/, scrapeCNNArticles(keyword, maxPages)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('Scraping completed.');
                    return [2 /*return*/];
            }
        });
    });
}
startScraping();
