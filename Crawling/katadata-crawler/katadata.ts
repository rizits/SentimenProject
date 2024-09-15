import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import * as csvWriter from 'csv-writer';

const keywords = [
    'pinjaman pemerintah', 'surat utang', 'investor asing', 'sbn ritel', 'sukuk', 'surat berharga negara',
    // ... other keywords
];

const maxPages = 2;

async function scrapeArticlesForKeywords() {
    const allArticles = [];

    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        const articlesForKeyword = await scrapeArticlesFromTagPage(keyword);
        allArticles.push(...articlesForKeyword);
    }

    saveToCSV(allArticles);
}

async function scrapeArticlesFromTagPage(keyword: string) {
    let pageNumber = 0;
    let morePages = true;
    const seenLinks = new Set<string>();
    const articles = [];

    while (morePages) {
        try {
            const formattedKeyword = encodeURIComponent(keyword).replace(/%20/g, '%2520'); // Format keyword for Katadata
            const url = `https://katadata.co.id/search/news/${formattedKeyword}/-/-/-/-/-/-/${pageNumber}`;
            console.log(`Scraping URL: ${url}`);

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const articleElements = $('article.article--berita.d-flex');

            let newArticleFound = false;

            for (let i = 0; i < articleElements.length; i++) {
                const element = articleElements[i];
                const title = $(element).find('h3.content-title.content-title--list.mb-3').text().trim();
                const link = $(element).find('a').attr('href') || '';
                
                if (title && link) {
                    const fullLink = link.startsWith('http') ? link : `https://katadata.co.id${link}`;

                    if (seenLinks.has(fullLink)) {
                        console.log(`Skipping already seen article: ${title}`);
                        continue;
                    }

                    console.log(`Fetching article: ${title}`);
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
            }

            pageNumber += 10; // Increment by 10 for the next page

            if (pageNumber >= maxPages * 10) {
                console.log(`Maximum pages reached for keyword "${keyword}". Stopping...`);
                morePages = false;
            }

        } catch (error) {
            console.error(`Error scraping Katadata for keyword "${keyword}" on page ${pageNumber}: ${error}`);
            morePages = false;
        }
    }

    return articles;
}

async function scrapeArticleContent(url: string): Promise<{ content: string; author: string; date: string }> {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const paragraphs = $('.detail-body.mb-4 p').map((i, el) => {
            return $(el).text().trim();
        }).get();

        const content = paragraphs.join('\n');
        const author = $('.detail-author-name a').text().trim();
        const date = $('.detail-date.text-gray').text().trim();

        return { content, author, date };
    } catch (error) {
        console.error(`Error fetching article content from ${url}:`, error);
        return { content: '', author: '', date: '' };
    }
}

function saveToCSV(articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[]) {
    if (articles.length === 0) {
        console.log(`No articles found.`);
        return;
    }

    const directory = path.join(__dirname, 'scraped_articles');
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    const csvPath = path.join(directory, `all_keywords_scraped_articles.csv`);
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
        fieldDelimiter: ';',
    });

    csv.writeRecords(articles)
        .then(() => {
            console.log(`Articles have been successfully saved to ${csvPath}`);
        })
        .catch(error => {
            console.error('Error writing CSV:', error);
        });
}

scrapeArticlesForKeywords().then(() => {
    console.log('Scraping finished.');
}).catch(error => {
    console.error(error);
});
