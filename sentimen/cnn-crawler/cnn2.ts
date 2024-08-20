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

async function scrapeArticlesForKeywords() {
    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        await scrapeArticlesFromSearchPage(keyword);
    }
}

async function scrapeArticlesFromSearchPage(keyword: string) {
    let pageNumber = 1;
    let morePages = true;

    const articles: { title: string; scrappingDate: string; articleDate: string; author: string; link: string; content: string }[] = [];

    while (morePages && pageNumber <= maxPages) {
        try {
            const url = `https://www.cnnindonesia.com/search/?query=${encodeURIComponent(keyword)}&page=${pageNumber}`;

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const articleElements = $('.list.media_rows.list-berita > article');

            if (articleElements.length === 0) {
                morePages = false;
                continue;
            }

            for (let i = 0; i < articleElements.length; i++) {
                const element = articleElements[i];
                const title = $(element).find('h2.title').text().trim();
                const link = $(element).find('a').attr('href') || '';

                if (title && link) {
                    console.log(`Mengambil artikel: ${title}`);
                    const articleUrl = link.startsWith('http') ? link : `https://www.cnnindonesia.com${link}`;
                    const articleData = await axios.get(articleUrl);
                    const $$ = cheerio.load(articleData.data);

                    // Mengambil konten artikel
                    const content = $$('.detail_text').text().trim();
                    
                    // Mengambil waktu terbit artikel
                    const publishTime = $$('div.date').text().trim();

                    // Mengambil penulis artikel
                    const authorElement = $$('.detail_text strong').last().text().trim();
                    const author = authorElement || 'Tidak Diketahui';

                    articles.push({
                        title: title,
                        scrappingDate: new Date().toISOString(),
                        articleDate: publishTime,
                        author: author,  // Menyimpan penulis di sini
                        link: articleUrl,
                        content: content
                    });
                }
            }

            pageNumber += 1;

        } catch (error) {
            console.error(`Error scraping CNN for keyword "${keyword}" on page ${pageNumber}: ${error}`);
            morePages = false;
        }
    }

    saveToCSV(articles, keyword);
}

// Save to csv
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

// Run Scrap functions
scrapeArticlesForKeywords().then(() => {
    console.log('Scraping selesai.');
}).catch(error => {
    console.error(error);
});
