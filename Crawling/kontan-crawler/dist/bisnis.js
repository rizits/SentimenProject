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
const csvWriter = __importStar(require("csv-writer"));
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
                //const base_url = 'https://www.kontan.co.id/search/?search=obligasi-negara&per_page=20'
                const url = `https://www.kontan.co.id/search/?search=${encodeURIComponent(keyword)}&per_page=${pageNumber}`;
                //const url = `https://search.bisnis.com/?q=${encodeURIComponent(keyword)}&page=${pageNumber}`;
                console.log(`Scraping URL: ${url}`);
                const { data } = yield axios_1.default.get(url);
                const $ = cheerio.load(data);
                const articleElements = $('.sp-hl linkto-black');
                let newArticleFound = false;
                for (let i = 0; i < articleElements.length; i++) {
                    const element = articleElements[i];
                    const title = $(element).find('.a').text().trim();
                    const link = $(element).find('.a').attr('href') || '';
                    const publishTime = $(element).find('.artDate').text().trim();
                    if (title && link) {
                        const fullLink = link.startsWith('http') ? link : `https://search.bisnis.com${link}`;
                        // Cek apakah artikel ini sudah pernah diproses di halaman sebelumnya
                        if (seenLinks.has(fullLink)) {
                            console.log(`Skipping already seen article: ${title}`);
                            continue;
                        }
                        console.log(`Mengambil artikel: ${title}`);
                        seenLinks.add(fullLink); // Tambahkan link ke daftar yang sudah dilihat
                        newArticleFound = true; // Menandai bahwa setidaknya ada satu artikel baru ditemukan
                        try {
                            const { content, author } = yield scrapeArticleContent(fullLink);
                            articles.push({
                                title: title,
                                scrappingDate: new Date().toISOString(),
                                articleDate: publishTime,
                                author: author || '',
                                link: fullLink,
                                content: content || ''
                            });
                        }
                        catch (error) {
                            console.error(`Error fetching article content from ${fullLink}:`, error);
                        }
                    }
                }
                // Jika tidak ada artikel baru yang ditemukan di halaman ini, hentikan loop
                if (!newArticleFound) {
                    console.log(`No new articles found for keyword "${keyword}" at page ${pageNumber}. Stopping...`);
                    morePages = false;
                    break;
                }
                pageNumber += 1;
                // Batasi jumlah halaman untuk setiap keyword (misalnya 5000 halaman)
                if (pageNumber > maxPages) {
                    console.log(`Maximum pages reached for keyword "${keyword}". Stopping...`);
                    morePages = false;
                }
            }
            catch (error) {
                console.error(`Error scraping Bisnis.com for keyword "${keyword}" on page ${pageNumber}: ${error}`);
                morePages = false;
            }
        }
        saveToCSV(articles, keyword);
    });
}
function scrapeArticleContent(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data } = yield axios_1.default.get(url);
            const $ = cheerio.load(data);
            const content = $('.detailsContent').text().trim();
            const author = $('.detailsAuthorItem').first().text().replace('Penulis :', '').trim();
            return { content, author };
        }
        catch (error) {
            console.error(`Error fetching article content from ${url}:`, error);
            return { content: '', author: '' };
        }
    });
}
function saveToCSV(articles, keyword) {
    if (articles.length === 0) {
        console.log(`Tidak ada artikel yang ditemukan untuk kata kunci "${keyword}".`);
        return;
    }
    const directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    const csvPath = path.join(directory, `${keyword.replace(/ /g, '_')}_scraped_articles.csv`);
    const createCsvWriter = csvWriter.createObjectCsvWriter;
    const csv = createCsvWriter({
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
        .then(() => {
        console.log(`Artikel telah berhasil disimpan ke ${csvPath}`);
    })
        .catch(error => {
        console.error('Error menulis CSV:', error);
    });
}
scrapeArticlesForKeywords().then(() => {
    console.log('Scraping selesai.');
}).catch(error => {
    console.error(error);
});
//# sourceMappingURL=bisnis.js.map