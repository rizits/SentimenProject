import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';
import * as csvWriter from 'csv-writer';

const keywords = [
    //'pinjaman pemerintah', 'surat utang', 'investor asing', 'sbn ritel', 'sukuk',
    //'surat berharga negara', 'kreditur pemerintah', 'ori', 'pasar obligasi', 
    //'obligasi negara', 'inflasi', 'suku bunga', 'sun', 'jatuh tempo', 
    //'nilai tukar', 'kepemilikan asing', 'yield', 'ust', 'us treasury', 
    //'surat utang negara', 'obligasi pemerintah', 'obligasi ritel indonesia', 
    //'kebijakan moneter', 'likuiditas pasar', 'imbal hasil', 'pasar global', 
    'rating kredit', 'sentimen pasar', 'pasar sekunder', 'Obligasi Negara', 
    'Surat Utang Negara', 'Pergerakan Yield', 'Analisis Sentimen', 'Yield Obligasi', 
    'Pasar Obligasi', 'Kinerja Obligasi', 'Tren Yield', 'Pengaruh Makroekonomi', 
    'Kondisi Ekonomi', 'Suku Bunga', 'Kebijakan Moneter', 'Inflasi', 
    'Pasar Keuangan', 'Volatilitas Pasar', 'Pergerakan Suku Bunga', 
    'Imbal Hasil', 'Krisis Keuangan', 'Pemerintah Indonesia', 'Sentimen Investor'
];

const maxPages = 9999;

// Konfigurasi axios dengan timeout lebih panjang
const axiosConfig = {
    timeout: 20000 // Set timeout to 20 seconds
};

async function scrapeArticlesForKeywords() {
    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        await scrapeArticlesFromSearchPage(keyword);
        await sleep(5000); // Jeda 5 detik antara scraping kata kunci
    }
}

async function scrapeArticlesFromSearchPage(keyword: string) {
    let pageNumber = 1;
    let morePages = true;

    const articles = [];

    while (morePages && pageNumber <= maxPages) {
        try {
            const url = `https://www.cnnindonesia.com/search/?query=${encodeURIComponent(keyword)}&page=${pageNumber}`;
            let attempt = 0;
            let maxAttempts = 5;
            let data;

            // Logika retry
            while (attempt < maxAttempts) {
                try {
                    const response = await axios.get(url, axiosConfig);
                    data = response.data;
                    break;  // Jika berhasil, keluar dari loop retry
                } catch (error) {
                    attempt++;
                    console.error(`Attempt ${attempt} failed for ${url}: ${error}`);
                    if (attempt >= maxAttempts) throw error;
                    await sleep(2000);  // Tunggu 2 detik sebelum retry
                }
            }

            const $ = cheerio.load(data);

            const articleElements = $('article.flex-grow');

            if (articleElements.length === 0) {
                morePages = false;
                continue;
            }

            for (let i = 0; i < articleElements.length; i++) {
                const element = articleElements[i];
                const title = $(element).find('h2.text-cnn_black_light').text().trim();
                const link = $(element).find('a').attr('href') || '';
                const articleUrl = link.startsWith('http') ? link : `https://www.cnnindonesia.com${link}`;

                if (title && articleUrl) {
                    console.log(`Mengambil artikel: ${title}`);
                    const articleData = await axios.get(articleUrl, axiosConfig);
                    const $$ = cheerio.load(articleData.data);
                    const content = $$('.detail-text.text-cnn_black.text-sm.grow.min-w-0').text().trim();
                    const publishTime = $(element).find('span.text-cnn_black_light3').text().trim();

                    articles.push({
                        title: title,
                        scrappingDate: new Date().toISOString(),
                        articleDate: publishTime,
                        author: '',
                        link: articleUrl,
                        content: content
                    });
                }
            }

            pageNumber += 1;
            await sleep(5000); // Jeda 5 detik antara halaman

        } catch (error) {
            console.error(`Error scraping CNN for keyword "${keyword}" on page ${pageNumber}: ${error}`);
            morePages = false;
        }
    }

    saveToCSV(articles, keyword);
}

function saveToCSV(articles, keyword) {
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

// Fungsi sleep untuk menambahkan jeda
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Jalankan fungsi scraping
scrapeArticlesForKeywords().then(() => {
    console.log('Scraping selesai.');
}).catch(error => {
    console.error(error);
});