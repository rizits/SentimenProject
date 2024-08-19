import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import puppeteer from 'puppeteer';
import { createObjectCsvWriter as csvWriter } from 'csv-writer';

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

async function scrapeArticlesForKeywords(): Promise<void> {
    console.log('Starting the scraping process...');
    const allArticles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[] = [];
    const seenLinks = new Set<string>();

    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        try {
            const articlesForKeyword = await scrapeArticlesFromTagPage(keyword, seenLinks);
            if (articlesForKeyword.length > 0) {
                allArticles.push(...articlesForKeyword);
                console.log(`Found ${articlesForKeyword.length} articles for keyword "${keyword}".`);
            } else {
                console.log(`No articles found for keyword "${keyword}".`);
            }
        } catch (error) {
            console.error(`Error while scraping articles for keyword "${keyword}":`, error);
        }
    }

    if (allArticles.length > 0) {
        saveToCSV(allArticles); // Save all articles to one CSV file
    } else {
        console.log('No articles found for any keywords.');
    }
}

async function scrapeArticlesFromTagPage(keyword: string, seenLinks: Set<string>): Promise<{ title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[]> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const url = `https://www.viva.co.id/search?q=${encodeURIComponent(keyword)}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    let articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[] = [];
    let loadMoreVisible = true;
    let lastArticleCount = 0;

    while (loadMoreVisible) {
        // Scrape articles currently loaded on the page
        const newArticles = await page.evaluate(() => {
            const items = document.querySelectorAll('.article-list-row');
            const articles: { title: string; link: string; publishTime: string }[] = [];
            items.forEach(item => {
                const titleElement = item.querySelector('.article-list-title') as HTMLElement;
                const linkElement = item.querySelector('.article-list-title') as HTMLAnchorElement;
                const dateElement = item.querySelector('.article-list-date') as HTMLElement;

                const title = titleElement ? titleElement.innerText.trim() : '';
                const link = linkElement ? linkElement.href : '';
                const publishTime = dateElement ? dateElement.innerText.trim() : '';

                articles.push({ title, link, publishTime });
            });
            return articles;
        });

        if (newArticles.length <= lastArticleCount) {
            console.log("No new articles loaded, stopping...");
            break;
        }

        lastArticleCount = newArticles.length;

        for (const article of newArticles) {
            const normalizedLink = new URL(article.link, 'https://www.viva.co.id').href;

            if (seenLinks.has(normalizedLink)) {
                console.log(`Skipping already seen article: ${article.title}`);
                continue;
            }

            seenLinks.add(normalizedLink);

            const articleDetails = await scrapeArticleContent(normalizedLink);
            articles.push({
                title: article.title,
                scrappingDate: new Date().toISOString(),
                articleDate: article.publishTime,
                author: articleDetails.author,
                link: normalizedLink,
                content: articleDetails.content
            });
        }

        loadMoreVisible = await page.evaluate(() => {
            const loadMoreButton = document.querySelector('#load-more-btn') as HTMLElement | null;
            if (loadMoreButton && loadMoreButton.style.display !== 'none') {
                loadMoreButton.click();
                return true;
            }
            return false;
        });

        if (loadMoreVisible) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the new articles to load
        }
        
    }

    await browser.close();
    return articles;
}

async function scrapeArticleContent(url: string): Promise<{ content: string; author: string }> {
    try {
        console.log(`Fetching content from: ${url}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const content = $('.main-content-detail p').text().trim(); // Updated for Viva.co.id
        const author = $('.main-content-author a').text().trim(); // Updated for Viva.co.id
        return { content, author };
    } catch (error) {
        console.error(`Error fetching article content from ${url}:`, error);
        return { content: '', author: '' };
    }
}

function saveToCSV(articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[]): void {
    if (articles.length === 0) {
        console.log(`No articles found to save.`);
        return;
    }

    const directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    const csvPath = path.join(directory, `all_keywords_scraped_articles.csv`);
    const csv = csvWriter({
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
            console.log(`Articles successfully saved to ${csvPath}`);
        })
        .catch(error => {
            console.error('Error writing to CSV:', error);
        });
}

// Start the scraping process
scrapeArticlesForKeywords().then(() => {
    console.log('Scraping process completed.');
}).catch(error => {
    console.error('Error during the scraping process:', error);
});
