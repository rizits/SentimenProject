import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
from datetime import datetime

# Daftar kata kunci
KEYWORD = [
    # "Sovereign Debt Sentiment",
    # "Bond Yield Sentiment Analysis",
    # "Government Bond Market",
    # "Sovereign Yield Fluctuation",
    # "Debt Market Sentiment",
    # "Yield Curve Analysis",
    # "Fixed Income Market Sentiment",
    # "Bond Market Volatility",
    # "Treasury Yield Sentiment",
    # "Interest Rate Sentiment",
    # "Yield Spread Sentiment",
    # "Market Sentiment on Bonds",
    # "Sovereign Credit Risk Analysis",
    # "Government Securities Yield",
    # "Sentiment on Bond Prices",
    # "Bond Market Forecast",
    # "Yield Spread Analysis",
    # "Debt Securities Market",
    # "Global Bond Market Trends",
    # "Sentiment in Fixed Income Trading",
    # "economic growth",
    # "inflation rates",
    # "interest rates",
    # "monetary policy",
    # "geopolitical tensions",
    # "market volatility",
    # "risk appetite",
    # "safe haven demand",
    # "credit ratings",
    # "economic indicators",
    "global trade",
    "currency earnings",
    "currency fluctuations",
    "commodity prices",
    "fiscal policy",
    "debt levels",
    "liquidity conditions",
    "global supply chains",
    "political events",
    "investors sentiments",
]

bbc_base_url = "https://www.bbc.com"
api_base_url = "https://web-cdn.api.bbci.co.uk/xd/search?terms={}&page={}&pageSize=9"

# Fungsi untuk mengambil total artikel untuk keyword tertentu
def fetch_total_articles(keyword):
    response = requests.get(api_base_url.format(keyword, 1))
    if response.status_code == 200:
        data = response.json()
        total_articles = data.get('total', 0)  # Ambil total artikel
        return total_articles
    return 0

# Fungsi untuk mengambil artikel dari API berdasarkan keyword
def fetch_articles(keyword, total_pages):
    all_articles = []
    for page in range(total_pages):
        print(f"Fetching page {page + 1} for keyword: {keyword}")  # Menampilkan informasi halaman
        response = requests.get(api_base_url.format(keyword, page))
        
        if response.status_code == 200:
            data = response.json()
            articles = data['data']
            all_articles.extend(articles)
        else:
            print(f"Failed to fetch page {page + 1} for keyword: {keyword}")
    
    return all_articles

# Fungsi untuk melakukan scraping pada konten artikel
def scrape_article_content(url):
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")

        article_body = soup.find('article')
        if article_body:
            paragraphs = article_body.find_all('p')
            content = ' '.join([p.get_text() for p in paragraphs])
        else:
            content_div = soup.find('div', class_='ssrcss-uf6wea-RichTextComponentWrapper')
            paragraphs = content_div.find_all('p') if content_div else []
            content = ' '.join([p.get_text() for p in paragraphs]) if paragraphs else "No content available"
        
        author_name = None
        
        # First attempt: metadata in a JSON-LD script tag (if available)
        json_ld = soup.find('script', type='application/ld+json')
        if json_ld:
            try:
                json_content = json.loads(json_ld.string)
                
                if isinstance(json_content.get('author'), list):
                    author_name = ', '.join([author.get('name', 'Unknown') for author in json_content['author']])
                elif isinstance(json_content.get('author'), dict):
                    author_name = json_content['author'].get('name', 'Unknown')
                else:
                    author_name = "Unknown"
            except json.JSONDecodeError:
                pass

        if not author_name:
            author_div = soup.find('div', class_='sc-25be3b35-12 dTkONP')  # Example class
            if author_div:
                author_spans = author_div.find_all('span')
                author_names = [span.get_text() for span in author_spans]
                author_name = ', '.join(author_names) if author_names else "Unknown"

        if not author_name:
            author_name = "Unknown"
        
        return content, author_name
    else:
        return "Failed to retrieve the article", "Unknown"

# Fungsi untuk menyimpan data ke CSV
def save_to_csv(articles, keyword, filename_prefix="articles_with_content"):
    extracted_data = []
    current_date = datetime.now().strftime("%Y-%m-%d")

    for article in articles:
        # Cek apakah 'path' ada dan valid
        path = article.get("path")
        if path:
            # Menampilkan pesan artikel yang sedang di-scrape
            print(f"Proses scraping judul: {article.get('title')}")
            
            full_url = bbc_base_url + path  # Gabungkan path dengan base URL
            content, author_name = scrape_article_content(full_url)
            
            article_info = {
                "Keyword": keyword,
                "Title": article.get("title"),
                "Scrapping Date": current_date,
                "Article Date": article.get("firstPublishedAt", "").split('T')[0],
                "Author": author_name,
                "Link": full_url,
                "Content": content if content else "No content available"
            }
            extracted_data.append(article_info)
        else:
            # Jika 'path' None, skip artikel tersebut
            print(f"Skipping article with missing path for keyword '{keyword}'")

    # Menyimpan data ke CSV
    df = pd.DataFrame(extracted_data)
    filename = f"{filename_prefix}_{keyword.replace(' ', '_')}.csv"
    df.to_csv(filename, columns=["Keyword", "Title", "Scrapping Date", "Article Date", "Author", "Link", "Content"], index=False)
    print(f"Data for keyword '{keyword}' saved to {filename}")

# Loop melalui semua kata kunci dan scrape artikelnya
for keyword in KEYWORD:
    total_articles = fetch_total_articles(keyword)  # Dapatkan total artikel
    if total_articles > 0:
        total_pages = (total_articles // 9) + 1  # Hitung jumlah halaman
        articles = fetch_articles(keyword, total_pages)  # Ambil semua artikel
        save_to_csv(articles, keyword)  # Simpan data ke CSV
    else:
        print(f"No articles found for keyword: {keyword}")
