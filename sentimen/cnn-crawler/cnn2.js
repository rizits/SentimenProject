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
    //'pinjaman pemerintah', 'surat utang', 'investor asing', 'sbn ritel', 'sukuk',
    //'surat berharga negara', 'kreditur pemerintah', 'ori', 'pasar obligasi', 
    //'obligasi negara', 'inflasi', 'suku bunga', 'sun', 'jatuh tempo', 
    //'nilai tukar', 'kepemilikan asing', 'yield', 'ust', 'us treasury', 
    //'surat utang negara', 'obligasi pemerintah', 'obligasi ritel indonesia', 
    //'kebijakan moneter', 'likuiditas pasar', 'imbal hasil', 'pasar global',
    'rating kredit', 'sentimen pasar', 'pasar sekunder', 'Obligasi Negara',
    'Surat Utang Negara', 'Pergerakan Yield', 'Analisis Sentimen',
    'Yield Obligasi', 'Pasar Obligasi', 'Kinerja Obligasi', 'Tren Yield',
    'Pengaruh Makroekonomi', 'Kondisi Ekonomi', 'Suku Bunga',
    'Kebijakan Moneter', 'Inflasi', 'Pasar Keuangan', 'Volatilitas Pasar',
    'Pergerakan Suku Bunga', 'Imbal Hasil', 'Krisis Keuangan',
    'Pemerintah Indonesia', 'Sentimen Investor'
];
var maxPages = 5; // Sesuaikan sesuai kebutuhan
function scrapeArticlesForKeywords() {
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
                    return [4 /*yield*/, scrapeArticlesFromSearchPage(keyword)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function scrapeArticlesFromSearchPage(keyword) {
    return __awaiter(this, void 0, void 0, function () {
        var pageNumber, morePages, articles, url, data, $, articleElements, _i, _a, element, $element, title, link, articleUrl, articleData, $$, content, publishTime, authorElement, author, articleError_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    pageNumber = 1;
                    morePages = true;
                    articles = [];
                    _b.label = 1;
                case 1:
                    if (!(morePages && pageNumber <= maxPages)) return [3 /*break*/, 12];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 10, , 11]);
                    url = "https://www.cnnindonesia.com/search/?query=".concat(encodeURIComponent(keyword), "&page=").concat(pageNumber);
                    console.log("Requesting URL: ".concat(url));
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 3:
                    data = (_b.sent()).data;
                    $ = cheerio.load(data);
                    articleElements = $('.grow-0.w-leftcontent.min-w-0 article');
                    if (articleElements.length === 0) {
                        console.log('No more articles found.');
                        morePages = false;
                        return [3 /*break*/, 1];
                    }
                    _i = 0, _a = articleElements.toArray();
                    _b.label = 4;
                case 4:
                    if (!(_i < _a.length)) return [3 /*break*/, 9];
                    element = _a[_i];
                    $element = $(element);
                    title = $element.find('h2').text().trim();
                    link = $element.find('a').attr('href') || '';
                    if (!(title && link)) return [3 /*break*/, 8];
                    console.log("Fetching article: ".concat(title));
                    articleUrl = link.startsWith('http') ? link : "https://www.cnnindonesia.com".concat(link);
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, axios_1.default.get(articleUrl)];
                case 6:
                    articleData = _b.sent();
                    $$ = cheerio.load(articleData.data);
                    content = $$('.detail_text').text().trim();
                    publishTime = $$('.date').text().trim();
                    authorElement = $$('.detail_text strong').last().text().trim();
                    author = authorElement || 'Tidak Diketahui';
                    articles.push({
                        title: title,
                        scrappingDate: new Date().toISOString(),
                        articleDate: publishTime,
                        author: author,
                        link: articleUrl,
                        content: content
                    });
                    return [3 /*break*/, 8];
                case 7:
                    articleError_1 = _b.sent();
                    console.error("Error fetching article at \"".concat(articleUrl, "\": ").concat(articleError_1));
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9:
                    pageNumber += 1;
                    return [3 /*break*/, 11];
                case 10:
                    error_1 = _b.sent();
                    console.error("Error scraping page ".concat(pageNumber, ": ").concat(error_1));
                    morePages = false;
                    return [3 /*break*/, 11];
                case 11: return [3 /*break*/, 1];
                case 12:
                    saveToCSV(articles, keyword);
                    return [2 /*return*/];
            }
        });
    });
}
function saveToCSV(articles, keyword) {
    if (articles.length === 0) {
        console.log("No articles found for keyword \"".concat(keyword, "\"."));
        return;
    }
    var directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    var csvPath = path.join(directory, "".concat(keyword.replace(/ /g, '_'), "_scraped_articles.csv"));
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
        ]
    });
    csv.writeRecords(articles)
        .then(function () {
        console.log("Articles successfully saved to ".concat(csvPath));
    })
        .catch(function (error) {
        console.error('Error writing CSV:', error);
    });
}
// Run Scrap functions
scrapeArticlesForKeywords().then(function () {
    console.log('Scraping completed.');
}).catch(function (error) {
    console.error(error);
});
