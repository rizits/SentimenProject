import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// List of keywords to search
const keywords = [
    'rating kredit', 'sentimen pasar', 'pasar sekunder', 'Obligasi Negara', 
    'Surat Utang Negara', 'Pergerakan Yield', 'Analisis Sentimen', 'Yield Obligasi', 
    'Pasar Obligasi', 'Kinerja Obligasi', 'Tren Yield', 'Pengaruh Makroekonomi', 
    'Kondisi Ekonomi', 'Suku Bunga', 'Kebijakan Moneter', 'Inflasi', 
    'Pasar Keuangan', 'Volatilitas Pasar', 'Pergerakan Suku Bunga', 
    'Imbal Hasil', 'Krisis Keuangan', 'Pemerintah Indonesia', 'Sentimen Investor'
];

// Maximum number of pages to scrape for each keyword
const maxPages = 10;

// Create the output directory if it doesn't exist
const outputDir = path.join(__dirname, 'scraped_articles');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Function to scrape the details of a single article
async function scrapeArticleDetails(url: string) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const title = $('h1').text().trim();
        const scrappingDate = new Date().toISOString();
        const articleDate = $('div.text-cnn_grey.text-sm.mb-4').text().trim();
        const author = $('div.text-cnn_black_light3.text-sm.mb-2.5').text().split('|')[0].trim();
        const content = $('div.detail-text').text().trim();

        return {
            Title: title,
            ScrappingDate: scrappingDate,
            ArticleDate: articleDate,
            Author: author,
            Link: url,
            Content: content
        };
    } catch (error) {
        console.error(`Error scraping article details from ${url}:`, error);
        return null;
    }
}

// Function to scrape articles from search results pages
async function scrapeCNNArticles(keyword: string, maxPages: number) {
    const baseUrl = 'https://www.cnnindonesia.com/search/';
    const articles = [];

    for (let page = 1; page <= maxPages; page++) {
        try {
            const response = await axios.get(`${baseUrl}?query=${encodeURIComponent(keyword)}&page=${page}`);
            const $ = cheerio.load(response.data);

            // Get all article links from the search results
            const articleLinks = $('div.flex.flex-col.gap-5 article a[href]').map((_, element) => {
                return $(element).attr('href');
            }).get();

            for (const articleUrl of articleLinks) {
                const articleDetails = await scrapeArticleDetails(articleUrl);
                if (articleDetails) {
                    articles.push(articleDetails);
                }
            }
        } catch (error) {
            console.error(`Error scraping page ${page} for keyword "${keyword}":`, error);
        }
    }

    if (articles.length > 0) {
        saveToCSV(articles, keyword);
    }
}

// Function to save articles data to a CSV file
function saveToCSV(data: any[], keyword: string) {
    const sanitizedKeyword = keyword.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const csvFilePath = path.join(outputDir, `${sanitizedKeyword}_scraped_articles.csv`);
    const headers = 'Title,Scrapping Date,Article Date,Author,Link,Content\n';
    const rows = data.map(article => (
        `"${article.Title}","${article.ScrappingDate}","${article.ArticleDate}","${article.Author}","${article.Link}","${article.Content.replace(/"/g, '""')}"\n`
    )).join('');

    fs.writeFileSync(csvFilePath, headers + rows, 'utf-8');
    console.log(`Articles for keyword "${keyword}" saved to ${csvFilePath}`);

    // Log the titles of the scraped articles
    const logFilePath = path.join(outputDir, 'scraping_log.txt');
    const logEntries = data.map(article => `Keyword: ${keyword}, Title: ${article.Title}`).join('\n') + '\n';
    fs.appendFileSync(logFilePath, logEntries, 'utf-8');
}

// Start scraping for each keyword
async function startScraping() {
    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        await scrapeCNNArticles(keyword, maxPages);
    }
    console.log('Scraping completed.');
}

startScraping();
