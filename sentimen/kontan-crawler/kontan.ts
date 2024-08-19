import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

const keywords = [
    'pinjaman pemerintah', 'surat utang', 'investor asing', 'wakaf'
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
            const url = `https://www.kontan.co.id/search/?search=${encodeURIComponent(keyword)}&per_page=${pageNumber}`;
            console.log(`Scraping URL: ${url}`);

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const articleElements = $('li'); // Adjusted for Kontan
            let newArticleFound = false;

            for (let i = 0; i < articleElements.length; i++) {
                const element = articleElements[i];
                const title = $(element).find('.sp-hl a').text().trim(); // Adjusted selector for title
                const link = $(element).find('.sp-hl a').attr('href') || ''; // Adjusted selector for link

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

        // Extract all the text within the <p> tags inside the desired div
        const content = $('.tmpt-desk-kon p').not(':first').map((i, el) => $(el).text().trim()).get().join(' ');

        // Extract the author from the first <p> tag
        const author = $('.tmpt-desk-kon p').first().text().trim();

        // Extract Date
        const publishTime = $('div.fs14.ff-opensans.font-gray').text().trim();

        return { content, author, publishTime };  // Ensure publishTime is returned here
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
