from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
import requests
import pandas as pd
import time

# Inisialisasi opsi Chrome
chrome_options = Options()
chrome_options.add_argument("--headless")  # Mode headless, Chrome berjalan tanpa membuka jendela
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

# Menginisialisasi driver Chrome dengan WebDriver Manager
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

# Fungsi untuk mengambil request_id dari halaman CNN
def get_request_id():
    # Buka halaman CNN yang relevan
    url = 'https://www.cnn.com/some-page'  # Ganti dengan halaman yang tepat untuk mendapatkan request_id
    driver.get(url)

    # Tunggu beberapa saat hingga halaman termuat
    time.sleep(3)

    # Cari elemen script atau hidden input yang berisi request_id
    request_id_element = driver.find_element(By.XPATH, "//script[contains(text(), 'request_id')]")

    # Ambil innerHTML dari elemen tersebut dan ekstrak request_id
    script_content = request_id_element.get_attribute('innerHTML')

    # Lakukan parsing untuk mendapatkan request_id dari script JSON (ini adalah contoh)
    import json
    script_data = json.loads(script_content)
    request_id = script_data.get('request_id', '')

    print(f"Request ID: {request_id}")
    return request_id

# Dapatkan request_id menggunakan Selenium
request_id = get_request_id()

# Setelah mendapatkan request_id, tutup browser
driver.quit()

# Fungsi untuk mengambil artikel dari CNN API berdasarkan request_id
def fetch_cnn_articles(keyword, request_id, start_from=0):
    cnn_base_url = "https://search.prod.di.api.cnn.io/content?q={}&size=10&from={}&sort=newest&request_id={}"
    url = cnn_base_url.format(keyword, start_from, request_id)
    
    # Kirim request ke API CNN
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        return data.get('result', [])
    else:
        print(f"Error: {response.status_code}")
        return []

# Fungsi untuk menyimpan data ke CSV
def save_to_csv(articles, keyword):
    extracted_data = []

    for article in articles:
        title = article.get("headline", "No Title")
        link = article.get("url", "No URL")
        description = article.get("body", "No Description")

        extracted_data.append({
            "Title": title,
            "Link": link,
            "Description": description
        })

    # Simpan data ke file CSV
    df = pd.DataFrame(extracted_data)
    filename = f"cnn_articles_{keyword.replace(' ', '_')}.csv"
    df.to_csv(filename, index=False)
    print(f"Data saved to {filename}")

# Lakukan pencarian artikel dengan keyword tertentu
keyword = "Sovereign Debt Sentiment"
articles = fetch_cnn_articles(keyword, request_id)

# Simpan hasil scraping ke CSV
if articles:
    save_to_csv(articles, keyword)
else:
    print("No articles found.")
