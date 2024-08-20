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

    const articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string; category: string }[] = [];

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
                const category = $(element).find('span.linkto-orange.hrf-gede.mar-r-5 a').text().trim(); 

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
                        const { content, author, publishTime } = await scrapeArticleContent(fullLink, category);
                    
                        articles.push({
                            title: title,
                            category: category,
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

async function scrapeArticleContent(url: string, category: string): Promise<{ content: string; author: string; publishTime: string }> {
    try {
        console.log(`Fetching content from: ${url}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let content = '';
        let author = '';
        let publishTime = '';

        if (category === 'pressrelease') {
            content = $('#release-content p').map((i, el) => $(el).text().trim()).get().join(' ');
            author = $('.post p b').last().text().trim(); // Adjusted to select the editor's name
            // Extracting and formatting the publish date
            const day = $('.date .dd').text().trim();
            const month = $('.date .mm').text().trim();
            const year = $('.date .yy').text().trim();
            publishTime = `${day} ${month} ${year}`; // Formatting the date as "09 June 2024"
        } else if (category === 'kiaton') {
            content = $('.ctn p').not(':empty').map((i, el) => $(el).text().trim()).get().join(' ');
            author = $('.fs13.color-gray.mar-t-10 span').text().replace('Penulis:', '').trim(); // Extract the author from the span
            publishTime = $('.fs13.color-gray.mar-t-10').clone().children().remove().end().text().trim(); // Remove the child span to get only the date
        } else if (category === 'momsmoney.id') {
            content = $('.entry-content p').map((i, el) => $(el).text().trim()).get().join(' ');
            // Extracting the author (considering both reporter and editor)
            const reporter = $('.utf_post_author').first().text().replace('Reporter', '').trim();
            const editor = $('.utf_post_author').last().text().replace('Editor', '').trim();
            author = `${reporter}, ${editor}`;
            // Extract the publish time
            publishTime = $('.utf_post_date').text().trim();
        } else if (category === 'insight'){
            // Skip scraping content for insight category
            console.log(`Skipping premium content for insight category at ${url}`);
            return { content: 'Premium Content - Not Scraped', author: 'Premium User Only', publishTime: '' };
        } else {
            // Default or other categories
            content = $('.tmpt-desk-kon p').not(':first').map((i, el) => $(el).text().trim()).get().join(' ');
            author = $('.tmpt-desk-kon p').first().text().trim();
            // Extract the publish time
            publishTime = $('div.fs14.ff-opensans.font-gray').text().trim();
        }

        return { content, author, publishTime };  
    } catch (error) {
        console.error(`Error fetching article content from ${url}:`, error);
        return { content: '', author: '', publishTime: '' };  // Return publishTime even in case of an error
    }
}

function saveToCSV(articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string; category: string }[], keyword: string) {
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
            { id: 'content', title: 'Content' },
            { id: 'category', title: 'Category' }
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
