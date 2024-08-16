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
var csvWriter = require("csv-writer");
// Daftar kata kunci
var keywords = [
    'pinjaman pemerintah', 'surat utang'
];
// Fungsi utama untuk scraping
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
        var url, data, $, articles, articleElements, i, element, title, link, articleUrl, articleData, $$, content, publishTime, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    url = "https://www.cnnindonesia.com/tag/".concat(encodeURIComponent(keyword));
                    return [4 /*yield*/, axios_1.default.get(url)];
                case 1:
                    data = (_a.sent()).data;
                    $ = cheerio.load(data);
                    articles = [];
                    articleElements = $('.flex.flex-col.gap-5 > article');
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < articleElements.length)) return [3 /*break*/, 5];
                    element = articleElements[i];
                    title = $(element).find('h2').text().trim();
                    link = $(element).find('a').attr('href') || '';
                    if (!(title && link)) return [3 /*break*/, 4];
                    console.log("Mengambil artikel: ".concat(title));
                    articleUrl = link.startsWith('http') ? link : "https://www.cnnindonesia.com".concat(link);
                    return [4 /*yield*/, axios_1.default.get(articleUrl)];
                case 3:
                    articleData = _a.sent();
                    $$ = cheerio.load(articleData.data);
                    content = $$('.detail-text.text-cnn_black.text-sm.grow.min-w-0').text().trim();
                    publishTime = $$('div.text-cnn_grey.text-sm.mb-4').text().trim();
                    articles.push({
                        title: title,
                        publishTime: publishTime,
                        website: 'CNN Indonesia',
                        content: content
                    });
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    saveToCSV(articles, keyword);
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("Error scraping CNN for keyword \"".concat(keyword, "\": ").concat(error_1));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Fungsi untuk menyimpan hasil scraping ke file CSV
function saveToCSV(articles, keyword) {
    if (articles.length === 0) {
        console.log("Tidak ada artikel yang ditemukan untuk kata kunci \"".concat(keyword, "\"."));
        return;
    }
    var csvPath = path.join(__dirname, "".concat(keyword.replace(/ /g, '_'), "_scraped_articles.csv"));
    var createCsvWriter = csvWriter.createObjectCsvWriter;
    var csv = createCsvWriter({
        path: csvPath,
        header: [
            { id: 'title', title: 'Title' },
            { id: 'publishTime', title: 'Publish Time' },
            { id: 'website', title: 'Website' },
            { id: 'content', title: 'Content' }
        ]
    });
    csv.writeRecords(articles)
        .then(function () {
        console.log("Artikel telah berhasil disimpan ke ".concat(keyword.replace(/ /g, '_'), "_scraped_articles.csv"));
    })
        .catch(function (error) {
        console.error('Error menulis CSV:', error);
    });
}
// Menjalankan fungsi scraping
scrapeArticlesForKeywords().then(function () {
    console.log('Scraping selesai.');
}).catch(function (error) {
    console.error(error);
});
