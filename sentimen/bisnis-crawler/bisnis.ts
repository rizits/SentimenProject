import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import * as csvWriter from 'csv-writer';

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
const maxPages = 5000;

async function scrapeArticlesForKeywords() {
    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        await scrapeArticlesFromTagPage(keyword);
    }
}

async function scrapeArticlesFromTagPage(keyword: string) {
    let pageNumber = 1;
    let morePages = true;

    const articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[] = [];

    while (morePages) {
        try {
            const url = `https://search.bisnis.com/?q=${encodeURIComponent(keyword)}&page=${pageNumber}`;
            console.log(`Scraping URL: ${url}`);

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const articleElements = $('.artItem');

            if (articleElements.length === 0) {
                console.log(`No more articles found for keyword "${keyword}" at page ${pageNumber}. Stopping...`);
                morePages = false;
                break;
            }

            for (let i = 0; i < articleElements.length; i++) {
                const element = articleElements[i];
                const title = $(element).find('.artTitle').text().trim();
                const link = $(element).find('.artLink').attr('href') || '';
                const publishTime = $(element).find('.artDate').text().trim();

                if (title && link) {
                    const fullLink = link.startsWith('http') ? link : `https://search.bisnis.com${link}`;
                    console.log(`Mengambil artikel: ${title}`);

                    try {
                        const { content, author } = await scrapeArticleContent(fullLink);

                        articles.push({
                            title: title,
                            scrappingDate: new Date().toISOString(),
                            articleDate: publishTime,
                            author: author || '',
                            link: fullLink,
                            content: content || ''
                        });

                    } catch (error) {
                        console.error(`Error fetching article content from ${fullLink}:`, error);
                    }
                }
            }

            pageNumber += 1;

        } catch (error) {
            console.error(`Error scraping Bisnis.com for keyword "${keyword}" on page ${pageNumber}: ${error}`);
            morePages = false;
        }
    }

    saveToCSV(articles, keyword);
}

async function scrapeArticleContent(url: string): Promise<{ content: string; author: string }> {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const content = $('.detailsContent').text().trim();
        const author = $('.detailsAuthorItem').first().text().replace('Penulis :', '').trim();
        return { content, author };
    } catch (error) {
        console.error(`Error fetching article content from ${url}:`, error);
        return { content: '', author: '' };
    }
}

function saveToCSV(articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[], keyword: string) {
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
