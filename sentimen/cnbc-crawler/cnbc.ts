import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

const keywords = [
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

const maxPages = 1;

async function scrapeArticlesForKeywords() {
    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        await scrapeArticlesFromTagPage(keyword);
    }
}

async function scrapeArticlesFromTagPage(keyword: string) {
    let pageNumber = 1;
    let morePages = true;
    const seenLinks = new Set<string>();

    const articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[] = [];

    while (morePages) {
        try {
            const url = `https://www.cnbcindonesia.com/search?query=${encodeURIComponent(keyword)}&page=${pageNumber}`;
            console.log(`Scraping URL: ${url}`);

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const articleElements = $('div.nhl-list'); // Selecting the div containing the articles
            let newArticleFound = false;

            for (let i = 0; i < articleElements.length; i++) {
                const element = articleElements[i];
                const title = $(element).find('h2').text().trim(); // Adjusted selector for title
                const link = $(element).find('a').attr('href') || ''; // Adjusted selector for link

                if (title && link) {
                    // Correcting the link by removing 'www.kontan.co.id' and replacing it with the appropriate base domain
                    const fullLink = link.startsWith('http') ? link : `https://${link}`;

                    if (seenLinks.has(fullLink)) {
                        console.log(`Skipping already seen article: ${title}`);
                        continue;
                    }

                    console.log(`Mengambil artikel: ${title}`);
                    seenLinks.add(fullLink);
                    newArticleFound = true;

                    try {
                        const { content, author, publishTime } = await scrapeArticleContent(fullLink);
                    
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
            console.error(`Error scraping Kontan for keyword "${keyword}" on page ${pageNumber}: ${error}`);
            morePages = false;
        }
    }

    saveToCSV(articles, keyword);
}

async function scrapeArticleContent(url: string): Promise<{ content: string; author: string; publishTime: string }> {
    try {
        console.log(`Fetching content from: ${url}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        // Extracting content from all <p> tags within the 'detail-text' div
        const content = $('div.detail-text p').map((i, el) => $(el).text().trim()).get().join(' ');
         // Extracting the correct author by specifically targeting the correct div
        const author = $('div.detail-head div.mb-1.text-base.font-semibold').filter(function() {
            return $(this).find('span').length > 0;
        }).contents().first().text().trim();
        // Extracting the publish time
        const publishTime = $('div.text-cm.text-gray').first().text().trim();
        return { content, author, publishTime };  
    } catch (error) {
        console.error(`Error fetching article content from ${url}:`, error);
        return { content: '', author: '', publishTime: '' };  // Return publishTime even in case of an error
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
    const csv = createObjectCsvWriter({
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
