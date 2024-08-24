import axios from 'axios';
import fs from 'fs';
import { format } from 'date-fns';

async function fetchAndSaveAllNews() {
    const apiKey = '28e077f12116d5bc056e0658c04aafb9'; 
    const keyword = 'Sovereign Debt Sentiment';
    let offset = 0;
    const limit = 100; //limit API
    let allNews: string[] = [];

    while (true) {
        const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&keywords=${encodeURIComponent(keyword)}&languages=en&sort=published_desc&limit=${limit}&offset=${offset}`;
        
        try {
            const response = await axios.get(url);
            const news = response.data;

            if (news.data.length === 0) {
                break; // Berhenti jika tidak ada lagi artikel yang dikembalikan
            }

            for (const article of news.data) {
                const title = article.title ? article.title.replace(/;/g, ',') : 'No Title';
                const scrappingDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
                const articleDate = article.published_at || 'No Date';
                const author = article.author ? article.author.replace(/;/g, ',') : 'No Author';
                const content = article.description ? article.description.replace(/;/g, ',') : 'No Content';
                const link = article.url || 'No URL';

                allNews.push(`${title};${scrappingDate};${articleDate};${author};${link};${content}`);
            }

            offset += limit; // Lanjutkan ke batch berikutnya

        } catch (error) {
            console.error('Error fetching news:', error);
            break;
        }
    }

    if (allNews.length > 0) {
        const header = 'Title;Scrapping Date;Article Date;Author;Link;Content\n';
        const csvContent = header + allNews.join('\n');
        fs.writeFileSync('bbc_news.csv', csvContent, 'utf8');
        console.log('Data telah disimpan dalam bbc_news.csv');
    } else {
        console.log('Tidak ada berita yang ditemukan.');
    }
}

// Panggil fungsi untuk mengambil semua berita dan menyimpannya
fetchAndSaveAllNews();
