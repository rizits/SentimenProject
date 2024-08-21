# Sentiment Analysis and Yield Correlation for the Ministry of Finance (2008-2024)

## Overview

This project aims to perform a sentiment analysis on financial news articles and correlate the sentiment data with bond yields from the Ministry of Finance for the period 2008-2024. The sentiment analysis is performed using the VADER sentiment analysis tool, and the web scraping process to gather data is implemented using TypeScript (TS) and JavaScript (JS).

## Project Structure

- **/data**: Contains raw and processed datasets, including scraped financial news articles and bond yield data.
- **/scripts**: Includes all TypeScript and JavaScript scripts used for web scraping and data processing.
- **/notebooks**: Jupyter notebooks used for data analysis and visualization of the results.
- **/results**: Stores output data, including sentiment scores and correlation analysis results.
- **README.md**: This file, providing an overview and documentation of the project.

## Tools and Technologies

- **TypeScript & JavaScript**: Used for web scraping to collect news articles from various financial sources.
- **VADER Sentiment Analysis**: A tool to analyze the sentiment of textual data. VADER is particularly effective for analyzing social media text and is applied here to the news articles.
- **Python**: Used for data processing, analysis, and visualization. Includes libraries like Pandas, Matplotlib, and Scikit-learn.

## Analysis Process

1. **Data Collection**: 
   - Financial news articles are scraped from relevant websites using TypeScript and JavaScript scripts. 
   - Bond yield data is collected from the Ministry of Finance's official publications and databases.

2. **Sentiment Analysis**:
   - The VADER tool is used to calculate sentiment scores for each article. These scores range from -1 (negative sentiment) to +1 (positive sentiment).

3. **Yield Correlation**:
   - The sentiment scores are then correlated with the bond yields over the same period to analyze the relationship between public sentiment and financial performance.

4. **Visualization**:
   - Various plots and charts are generated to visualize the relationship between sentiment and bond yields over the 16-year period.

## Results

The results of the analysis will provide insights into how public sentiment, as reflected in financial news, correlates with bond yields. This could inform future decisions and strategies by the Ministry of Finance regarding communication and financial policy.

## Getting Started

### Prerequisites

- **Node.js**: Required to run the TypeScript and JavaScript scripts for web scraping.
- **Python 3.x**: Required for running the data analysis and visualization notebooks.
- **Pandas, Matplotlib, Scikit-learn**: Python libraries necessary for data processing and analysis.