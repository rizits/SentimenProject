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
var csv_writer_1 = require("csv-writer");
var keywords = [
    'pinjaman pemerintah', 'surat utang', 'investor asing', 'sbn ritel', 'sukuk',
    'surat berharga negara', 'kreditur pemerintah', 'ori', 'pasar obligasi',
    'obligasi negara', 'inflasi', 'suku bunga', 'sun', 'jatuh tempo',
    'nilai tukar', 'kepemilikan asing', 'yield', 'ust', 'us treasury',
    'surat utang negara', 'obligasi pemerintah', 'obligasi ritel indonesia',
    'kebijakan moneter', 'likuiditas pasar', 'imbal hasil', 'pasar global',
    'rating kredit', 'sentimen pasar', 'pasar sekunder', 'Obligasi Negara',
    'Surat Utang Negara', 'Pergerakan Yield', 'Analisis Sentimen', 'Yield Obligasi',
    'Pasar Obligasi', 'Kinerja Obligasi', 'Tren Yield', 'Pengaruh Makroekonomi',
    'Kondisi Ekonomi', 'Suku Bunga', 'Kebijakan Moneter', 'Inflasi', 'Pasar Keuangan',
    'Volatilitas Pasar', 'Pergerakan Suku Bunga', 'Imbal Hasil', 'Krisis Keuangan',
    'Pemerintah Indonesia', 'Sentimen Investor'
];
var maxPages = 1000;
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
                    return [4 /*yield*/, scrapeArticlesFromTagPage(keyword)];
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
function scrapeArticlesFromTagPage(keyword) {
    return __awaiter(this, void 0, void 0, function () {
        var pageNumber, morePages, seenLinks, articles, url, data, $, articleElements, newArticleFound, i, element, title, link, category, fullLink, _a, content, author, publishTime, error_1, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    pageNumber = 1;
                    morePages = true;
                    seenLinks = new Set();
                    articles = [];
                    _b.label = 1;
                case 1:
                    if (!morePages) return [3 /*break*/, 12];
                    url = void 0;
                    if (pageNumber === 1 || pageNumber === 2) {
                        url = "https://www.kontan.co.id/search/?search=".concat(encodeURIComponent(keyword), "&per_page=").concat(pageNumber * 10);
                    }
                    else {
                        url = "https://www.kontan.co.id/search/?search=".concat(encodeURIComponent(keyword), "&per_page=").concat((pageNumber - 1) * 20);
                    }
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 10, , 11]);
                    console.log("Scraping URL: ".concat(url));
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 3:
                    data = (_b.sent()).data;
                    $ = cheerio.load(data);
                    articleElements = $('li');
                    newArticleFound = false;
                    i = 0;
                    _b.label = 4;
                case 4:
                    if (!(i < articleElements.length)) return [3 /*break*/, 9];
                    element = articleElements[i];
                    title = $(element).find('.sp-hl a').text().trim();
                    link = $(element).find('.sp-hl a').attr('href') || '';
                    category = $(element).find('span.linkto-orange.hrf-gede.mar-r-5 a').text().trim();
                    if (!(title && link)) return [3 /*break*/, 8];
                    fullLink = link.startsWith('http') ? link : "https://".concat(link);
                    if (seenLinks.has(fullLink)) {
                        console.log("Skipping already seen article: ".concat(title));
                        return [3 /*break*/, 8];
                    }
                    console.log("Mengambil artikel: ".concat(title));
                    seenLinks.add(fullLink);
                    newArticleFound = true;
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, scrapeArticleContent(fullLink, category)];
                case 6:
                    _a = _b.sent(), content = _a.content, author = _a.author, publishTime = _a.publishTime;
                    articles.push({
                        title: title,
                        category: category,
                        scrappingDate: new Date().toISOString(),
                        articleDate: publishTime,
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
                    pageNumber += 1;
                    if (pageNumber > maxPages) {
                        console.log("Maximum pages reached for keyword \"".concat(keyword, "\". Stopping... at page \"").concat(pageNumber, "\""));
                        morePages = false;
                    }
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _b.sent();
                    console.error("Error scraping Kontan for keyword \"".concat(keyword, "\" on page ").concat(pageNumber, ": ").concat(error_2));
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
function scrapeArticleContent(url, category) {
    return __awaiter(this, void 0, void 0, function () {
        var data, $_1, content, author, publishTime, day, month, year, reporter, editor, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log("Fetching content from: ".concat(url));
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 1:
                    data = (_a.sent()).data;
                    $_1 = cheerio.load(data);
                    content = '';
                    author = '';
                    publishTime = '';
                    if (category === 'pressrelease') {
                        content = $_1('#release-content p').map(function (i, el) { return $_1(el).text().trim(); }).get().join(' ');
                        author = $_1('.post p b').last().text().trim(); // Adjusted to select the editor's name
                        day = $_1('.date .dd').text().trim();
                        month = $_1('.date .mm').text().trim();
                        year = $_1('.date .yy').text().trim();
                        publishTime = "".concat(day, " ").concat(month, " ").concat(year); // Formatting the date as "09 June 2024"
                    }
                    else if (category === 'kiaton') {
                        content = $_1('.ctn p').not(':empty').map(function (i, el) { return $_1(el).text().trim(); }).get().join(' ');
                        author = $_1('.fs13.color-gray.mar-t-10 span').text().replace('Penulis:', '').trim(); // Extract the author from the span
                        publishTime = $_1('.fs13.color-gray.mar-t-10').clone().children().remove().end().text().trim(); // Remove the child span to get only the date
                    }
                    else if (category === 'momsmoney.id') {
                        content = $_1('.entry-content p').map(function (i, el) { return $_1(el).text().trim(); }).get().join(' ');
                        reporter = $_1('.utf_post_author').first().text().replace('Reporter', '').trim();
                        editor = $_1('.utf_post_author').last().text().replace('Editor', '').trim();
                        author = "".concat(reporter, ", ").concat(editor);
                        // Extract the publish time
                        publishTime = $_1('.utf_post_date').text().trim();
                    }
                    else if (category === 'insight') {
                        // Skip scraping content for insight category
                        console.log("Skipping premium content for insight category at ".concat(url));
                        return [2 /*return*/, { content: 'Premium Content - Not Scraped', author: 'Premium User Only', publishTime: '' }];
                    }
                    else {
                        // Default or other categories
                        content = $_1('.tmpt-desk-kon p').not(':first').map(function (i, el) { return $_1(el).text().trim(); }).get().join(' ');
                        author = $_1('.tmpt-desk-kon p').first().text().trim();
                        // Extract the publish time
                        publishTime = $_1('div.fs14.ff-opensans.font-gray').text().trim();
                    }
                    return [2 /*return*/, { content: content, author: author, publishTime: publishTime }];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error fetching article content from ".concat(url, ":"), error_3);
                    return [2 /*return*/, { content: '', author: '', publishTime: '' }]; // Return publishTime even in case of an error
                case 3: return [2 /*return*/];
            }
        });
    });
}
function saveToCSV(articles, keyword) {
    if (articles.length === 0) {
        console.log("Tidak ada artikel yang ditemukan untuk kata kunci \"".concat(keyword, "\"."));
        return;
    }
    var directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    var csvPath = path.join(directory, "".concat(keyword.replace(/ /g, '_'), "_scraped_articles.csv"));
    var csv = (0, csv_writer_1.createObjectCsvWriter)({
        path: csvPath,
        header: [
            { id: 'title', title: 'Title' },
            { id: 'scrappingDate', title: 'Scrapping Date' },
            { id: 'articleDate', title: 'Article Date' },
            { id: 'author', title: 'Author' },
            { id: 'link', title: 'Link' },
            { id: 'content', title: 'Content' },
            { id: 'category', title: 'Category' }
        ]
    });
    csv.writeRecords(articles)
        .then(function () {
        console.log("Artikel telah berhasil disimpan ke ".concat(csvPath));
    })
        .catch(function (error) {
        console.error('Error menulis CSV:', error);
    });
}
scrapeArticlesForKeywords().then(function () {
    console.log('Scraping selesai.');
}).catch(function (error) {
    console.error(error);
});
