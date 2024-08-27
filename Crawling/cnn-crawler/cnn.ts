cdcdcdcdcdcdcdcimport axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as csvWriter from 'csv-writer';

// Daftar kata kunci
const keywords = [
    'pinjaman pemerintah', 'surat utang'
];

// Fungsi utama untuk scraping
async function scrapeArticlesForKeywords() {
    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        await scrapeArticlesFromTagPage(keyword);
    }
}

async function scrapeArticlesFromTagPage(keyword: string) {
    try {
        const url = `https://www.cnnindonesia.com/tag/${encodeURIComponent(keyword)}`;

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const articles: { title: string; publishTime: string; website: string; content: string }[] = [];

        const articleElements = $('.flex.flex-col.gap-5 > article');

        for (let i = 0; i < articleElements.length; i++) {
            const element = articleElements[i];
            const title = $(element).find('h2').text().trim();
            const link = $(element).find('a').attr('href') || '';

            if (title && link) {
                console.log(`Mengambil artikel: ${title}`);
                const articleUrl = link.startsWith('http') ? link : `https://www.cnnindonesia.com${link}`;
                const articleData = await axios.get(articleUrl);
                const $$ = cheerio.load(articleData.data);

                // Mengambil konten artikel
                const content = $$('.detail-text.text-cnn_black.text-sm.grow.min-w-0').text().trim();
                
                // Mengambil waktu terbit artikel
                const publishTime = $$('div.text-cnn_grey.text-sm.mb-4').text().trim();

                articles.push({
                    title: title,
                    publishTime: publishTime,
                    website: 'CNN Indonesia',
                    content: content
                });
            }
        }

        saveToCSV(articles, keyword);

    } catch (error) {
        console.error(`Error scraping CNN for keyword "${keyword}": ${error}`);
    }
}

// Fungsi untuk menyimpan hasil scraping ke file CSV
function saveToCSV(articles: { title: string; publishTime: string; website: string; content: string }[], keyword: string) {
    if (articles.length === 0) {
        console.log(`Tidak ada artikel yang ditemukan untuk kata kunci "${keyword}".`);
        return;
    }

    const csvPath = path.join(__dirname, `${keyword.replace(/ /g, '_')}_scraped_articles.csv`);
    const createCsvWriter = csvWriter.createObjectCsvWriter;
    const csv = createCsvWriter({
        path: csvPath,
        header: [
            { id: 'title', title: 'Title' },
            { id: 'publishTime', title: 'Publish Time' },
            { id: 'website', title: 'Website' },
            { id: 'content', title: 'Content' }
        ]
    });

    csv.writeRecords(articles)
        .then(() => {
            console.log(`Artikel telah berhasil disimpan ke ${keyword.replace(/ /g, '_')}_scraped_articles.csv`);
        })
        .catch(error => {
            console.error('Error menulis CSV:', error);
        });
}

// Menjalankan fungsi scraping
scrapeArticlesForKeywords().then(() => {
    console.log('Scraping selesai.');
}).catch(error => {
    console.error(error);
});
