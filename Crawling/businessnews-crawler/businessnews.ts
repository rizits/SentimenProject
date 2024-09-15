//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import * as csvWriter from 'csv-writer';

const keywords = [
    'pinjaman pemerintah', 'surat utang', 'investor asing'
];

const maxPages = 1;

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
    const articles: {
        title: string;
        scrappingDate: string;
        articleDate: string;
        author: string;
        link: string;
        content: string;
    }[] = [];

    while (morePages) {
        try {
            const url = `https://businessnews.co.id/page/${pageNumber}/?s=${encodeURIComponent(keyword)}`;
            console.log(`Scraping URL: ${url}`);

            const { data } = await axios.get(url); // Fetching the page data
            const $ = cheerio.load(data); // Loading the HTML into Cheerio

            const articleElements = $('article.type-post.format-standard.has-post-thumbnail'); // Target all articles with these common classes

            let newArticleFound = false;

            articleElements.each((i, element) => {
                const title = $(element).find('.title a').text().trim(); // Selector for the title
                const link = $(element).find('.title a').attr('href') || ''; // Selector for the link

                if (title && link) {
                    const fullLink = link.startsWith('http') ? link : `https://businessnews.co.id${link}`;

                    if (seenLinks.has(fullLink)) {
                        console.log(`Skipping already seen article: ${title}`);
                        return;
                    }

                    console.log(`Mengambil artikel: ${title}`);
                    seenLinks.add(fullLink);
                    newArticleFound = true;

                    articles.push({
                        title: title,
                        scrappingDate: new Date().toISOString(),
                        articleDate: '', // Adjust as needed for date
                        author: '', // Adjust as needed for author
                        link: fullLink,
                        content: '', // Content will be scraped later
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

        } catch (error) {
            console.error(`Error scraping Businessnews.co.id for keyword "${keyword}" on page ${pageNumber}: ${error}`);
            morePages = false;
        }
    }

    return articles; // Return the articles for this keyword
}

async function scrapeArticleContent(url: string): Promise<{ content: string; author: string; date: string }> {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract and format the article content
        const paragraphs = $('.entry-content.clearfix.single-post-content p').map((i, el) => {
            return $(el).text().trim();
        }).get();

        const content = paragraphs.join('\n'); // Join paragraphs with newlines

        // Scrape the author
        const author = $('.post-author-name b').text().trim();
        
        // Scrape the date
        const date = $('time.post-published').attr('datetime') || '';

        return { content, author, date };
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
        ],
        fieldDelimiter: ';', // Set semicolon as delimiter
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
