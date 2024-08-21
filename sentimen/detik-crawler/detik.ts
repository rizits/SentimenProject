import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import * as csvWriter from 'csv-writer';
import moment from 'moment'; // Use default import for moment

const keywords = [
    'pinjaman pemerintah', 'surat utang', 'investor asing', 'sbn ritel', 'sukuk', 'surat berharga negara',
    'kreditur pemerintah', 'ori', 'pasar obligasi', 'obligasi negara', 'inflasi', 'suku bunga', 'sun', 'jatuh tempo', 
    'nilai tukar', 'kepemilikan asing', 'yield', 'ust', 'us treasury', 'surat utang negara', 'obligasi pemerintah',
    'obligasi ritel indonesia', 'kebijakan moneter', 'likuiditas pasar', 'imbal hasil', 'pasar global', 'rating kredit',
    'sentimen pasar', 'pasar sekunder', 'Obligasi Negara', 'Surat Utang Negara', 'Pergerakan Yield', 'Analisis Sentimen',
    'Yield Obligasi', 'Pasar Obligasi', 'Kinerja Obligasi', 'Tren Yield', 'Pengaruh Makroekonomi', 'Kondisi Ekonomi',
    'Suku Bunga', 'Kebijakan Moneter', 'Inflasi', 'Pasar Keuangan', 'Volatilitas Pasar', 'Pergerakan Suku Bunga', 
    'Imbal Hasil', 'Krisis Keuangan', 'Pemerintah Indonesia', 'Sentimen Investor'
];

const maxPages = 10000;

async function scrapeArticlesForKeywords() {
    const allArticles = []; // Accumulate all articles here

    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        const articlesForKeyword = await scrapeArticlesFromTagPage(keyword);
        allArticles.push(...articlesForKeyword);
    }

    saveToCSV(allArticles); // Save all articles to one CSV file
}

async function scrapeArticlesFromTagPage(keyword: string) {
    let pageNumber = 1;
    let morePages = true;
    const seenLinks = new Set<string>();
    const articles = [];

    while (morePages) {
        try {
            const url = `https://www.detik.com/search/searchall?query=${encodeURIComponent(keyword)}&page=${pageNumber}&result_type=relevansi`;
            console.log(`Scraping URL: ${url}`);

            const { data } = await axios.get(url); // Fetching the page data
            const $ = cheerio.load(data); // Loading the HTML into Cheerio

            const articleElements = $('.list-content__item'); // Select the article containers

            let newArticleFound = false;

            for (let i = 0; i < articleElements.length; i++) {
                const element = articleElements[i];
                const title = $(element).find('.media__title a.media__link').text().trim(); // Selector for the title
                const link = $(element).find('.media__title a.media__link').attr('href') || ''; // Selector for the link

                if (title && link) {
                    const fullLink = link.startsWith('http') ? link : `https://www.detik.com${link}`;

                    if (seenLinks.has(fullLink)) {
                        console.log(`Skipping already seen article: ${title}`);
                        continue;
                    }

                    console.log(`Mengambil artikel: ${title}`);
                    seenLinks.add(fullLink);
                    newArticleFound = true;

                    try {
                        const { content, author, date } = await scrapeArticleContent(fullLink);

                        articles.push({
                            title: title,
                            scrappingDate: new Date().toISOString(),
                            articleDate: date || '',
                            author: author || '',
                            link: fullLink,
                            content: content || ''
                        });

                    } catch (error) {
                        console.error(`Error fetching article content from ${fullLink}:`, error);
                    }
                }
            }

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

        } catch (error) {
            console.error(`Error scraping Detik.com for keyword "${keyword}" on page ${pageNumber}: ${error}`);
            morePages = false;
        }
    }

    return articles; // Return the articles for this keyword
}

async function scrapeArticleContent(url: string): Promise<{ content: string; author: string; date: string }> {
    try {
        const { data } = await axios.get(url); // Fetching the article page
        const $ = cheerio.load(data); // Loading the HTML into Cheerio

        const content = $('.detail__body-text.itp_bodycontent').text().trim();
        const author = $('.detail__author').text().trim();
        const date = $('.detail__date').text().trim();
        

        return { content, author, date: date };
    } catch (error) {
        console.error(`Error fetching article content from ${url}:`, error);
        return { content: '', author: '', date: '' };
    }
}

function saveToCSV(articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[]) {
    if (articles.length === 0) {
        console.log(`Tidak ada artikel yang ditemukan.`);
        return;
    }

    const directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    const csvPath = path.join(directory, `all_keywords_scraped_articles.csv`); // Save all articles in one CSV
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
