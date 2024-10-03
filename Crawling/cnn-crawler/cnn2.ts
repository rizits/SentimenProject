import axios from 'axios';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as csvWriter from 'csv-writer';

// Daftar kata kunci
const keywords = [
    // 'pinjaman pemerintah', 'surat utang', 'investor asing', 'wakaf', 'sbn ritel',
    // 'surat berharga syariah negara', 'sbsn', 'pembiayaan', 'sukuk', 'hibah',
    // 'surat berharga negara', 'kreditur pemerintah', 'pdn', 'ekspor', 'aset',
    // 'penjamin', 'risiko kredit', 'ori', 'pasar obligasi', 'obligasi negara',
    // 'inflasi', 'suku bunga', 'sun', 'jatuh tempo', 'nilai tukar', 'kepemilikan asing',
    // 'yield', 'ust', 'us treasury', 'surat utang negara', 'obligasi pemerintah',
    // 'obligasi ritel indonesia', 'sbn', 'kebijakan moneter', 'likuiditas pasar',
    // 'imbal hasil', 'pasar global', 'rating kredit', 'sentimen pasar', 'pasar sekunder',
    // 'economic growth', 'inflation rates', 'interest rates', 'monetary policy',
    // 'geopolitical tensions', 'market volatility', 'risk appetite', 'safe haven demand',
    // 'credit ratings', 'economic indicators', 'global trade', 'currency earnings',
    // 'currency fluctuations', 'commodity prices', 'fiscal policy', 'debt levels',
    // 'liquidity conditions', 'global supply chains', 'political events', 'investors sentiments'
    'Lelang SUN', 'Lelang SBN', 'Lelang SBSN', 'Kebijakan fiskal', 'Defisit', 
    'APBN', 'Defisit fiskal', 'Defisit APBN', 'Pembiayaan', 'Pembiayaan defisit', 
    'Pembiayaan APBN', 'Pembiayaan utang', 'Pembiayaan infrastruktur', 'Risiko pasar', 
    'Risiko utang', 'Risiko fiskal', 'Risiko likuiditas', 'Utang negara', 'Utang pemerintah', 
    'Harga SUN', 'Harga SBN', 'Transaksi SUN', 'Transaksi SBN', 'Penerbitan SUN', 
    'Penerbitan SBN', 'Penerbitan obligasi negara', 'Yield SUN', 'Yield SBN', 'Bunga utang', 
    'Bunga SUN', 'Bunga SBN', 'Rasio utang', 'Pertumbuhan ekonomi', 'Keseimbangan primer', 
    'Portofolio utang', 'Portofolio SUN'
];

const maxPages = 10000; // Maksimum halaman

// Fungsi utama untuk scraping
async function scrapeArticlesForKeywords() {
    for (const keyword of keywords) {
        console.log(`Scraping articles for keyword: ${keyword}`);
        await scrapeArticlesFromTagPage(keyword);
    }
}

async function scrapeArticlesFromTagPage(keyword: string) {
    let pageNumber = 1;
    let morePages = true;

    const articles: { title: string; publishTime: string; website: string; content: string }[] = [];

    while (morePages && pageNumber <= maxPages) {
        try {
            const url = `https://www.cnnindonesia.com/tag/${encodeURIComponent(keyword)}/${pageNumber}`;

            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const articleElements = $('.flex.flex-col.gap-5 > article');

            if (articleElements.length === 0) {
                morePages = false;
                continue;
            }

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

            pageNumber += 1;

        } catch (error) {
            console.error(`Error scraping CNN for keyword "${keyword}" on page ${pageNumber}: ${error}`);
            morePages = false;
        }
    }

    saveToCSV(articles, keyword);
}

// Fungsi untuk menyimpan hasil scraping ke file CSV
function saveToCSV(articles: { title: string; publishTime: string; website: string; content: string }[], keyword: string) {
    if (articles.length === 0) {
        console.log(`Tidak ada artikel yang ditemukan untuk kata kunci "${keyword}".`);
        return;
    }

    const csvPath = path.join(__dirname, `${keyword.replace(/ /g, '_')}part_2_scraped_articles.csv`);
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
            console.log(`Artikel telah berhasil disimpan ke ${keyword.replace(/ /g, '_')}_CNN-Indonesia_articles.csv`);
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
