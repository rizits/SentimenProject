"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const csv_writer_1 = require("csv-writer");
const keywords = [
    'pinjaman pemerintah', 'surat utang', 'investor asing', 'wakaf', 'sbn ritel',
    'surat berharga syariah negara', 'sbsn', 'pembiayaan', 'sukuk', 'hibah',
    'surat berharga negara', 'kreditur pemerintah', 'pdn', 'ekspor', 'aset',
    'penjamin', 'risiko kredit', 'ori', 'pasar obligasi', 'obligasi negara',
    'inflasi', 'suku bunga', 'sun', 'jatuh tempo', 'nilai tukar', 'kepemilikan asing',
    'yield', 'ust', 'us treasury', 'surat utang negara', 'obligasi pemerintah',
    'obligasi ritel indonesia', 'sbn', 'kebijakan moneter', 'likuiditas pasar',
    'imbal hasil', 'pasar global', 'rating kredit', 'sentimen pasar', 'pasar sekunder',
    'economic growth', 'inflation rates', 'interest rates', 'monetary policy',
    'geopolitical tensions', 'market volatility', 'risk appetite', 'safe haven demand',
    'credit ratings', 'economic indicators', 'global trade', 'currency earnings',
    'currency fluctuations', 'commodity prices', 'fiscal policy', 'debt levels',
    'liquidity conditions', 'global supply chains', 'political events', 'investors sentiments'
];
const maxPages = 1;
function scrapeArticlesForKeywords() {
    return __awaiter(this, void 0, void 0, function* () {
        for (const keyword of keywords) {
            console.log(`Scraping articles for keyword: ${keyword}`);
            yield scrapeArticlesFromTagPage(keyword);
        }
    });
}
function scrapeArticlesFromTagPage(keyword) {
    return __awaiter(this, void 0, void 0, function* () {
        let pageNumber = 1;
        let morePages = true;
        const seenLinks = new Set();
        const articles = [];
        while (morePages) {
            try {
                const url = `https://www.kontan.co.id/search/?search=${encodeURIComponent(keyword)}&per_page=${pageNumber}`;
                console.log(`Scraping URL: ${url}`);
                const { data } = yield axios_1.default.get(url);
                const $ = cheerio.load(data);
                const articleElements = $('.sp-hl.linkto-black');
                let newArticleFound = false;
                articleElements.each((i, element) => {
                    const titleElement = $(element).find('h1 a');
                    const title = titleElement.text().trim();
                    const link = titleElement.attr('href') || '';
                    const publishTime = $(element).closest('.ket').find('.font-gray').text().trim();
                    console.log(`Found article: ${title} - ${link} - ${publishTime}`);
                    if (title && link) {
                        const fullLink = link.startsWith('http') ? link : `https://www.kontan.co.id${link}`;
                        // Check if the article has already been processed
                        if (seenLinks.has(fullLink)) {
                            console.log(`Skipping already seen article: ${title}`);
                            return; // continue to next element
                        }
                        console.log(`Processing article: ${title}`);
                        seenLinks.add(fullLink); // Add link to the set of seen links
                        newArticleFound = true; // Mark that at least one new article was found
                        articles.push({
                            title: title,
                            scrappingDate: new Date().toISOString(),
                            articleDate: publishTime,
                            link: fullLink,
                            content: '' // Initialize content as empty since we're not fetching it here
                        });
                    }
                });
                if (!newArticleFound) {
                    console.log(`No new articles found for keyword "${keyword}" at page ${pageNumber}. Stopping...`);
                    morePages = false;
                    break;
                }
                pageNumber += 1;
                if (pageNumber > maxPages) {
                    console.log(`Maximum pages reached for keyword "${keyword}". Stopping...`);
                    morePages = false;
                }
            }
            catch (error) {
                console.error(`Error scraping Kontan.co.id for keyword "${keyword}" on page ${pageNumber}: ${error}`);
                morePages = false;
            }
        }
        saveToCSV(articles, keyword);
    });
}
function saveToCSV(articles, keyword) {
    if (articles.length === 0) {
        console.log(`No articles found for keyword "${keyword}".`);
        return;
    }
    const directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    const csvPath = path.join(directory, `${keyword.replace(/ /g, '_')}_scraped_articles.csv`);
    const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
        path: csvPath,
        header: [
            { id: 'title', title: 'Title' },
            { id: 'scrappingDate', title: 'Scrapping Date' },
            { id: 'articleDate', title: 'Article Date' },
            { id: 'link', title: 'Link' },
            { id: 'content', title: 'Content' }
        ]
    });
    csvWriter.writeRecords(articles)
        .then(() => {
        console.log(`Articles successfully saved to ${csvPath}`);
    })
        .catch(error => {
        console.error('Error writing CSV:', error);
    });
}
scrapeArticlesForKeywords().then(() => {
    console.log('Scraping completed.');
}).catch(error => {
    console.error('Error during scraping:', error);
});
//# sourceMappingURL=kontan.js.map