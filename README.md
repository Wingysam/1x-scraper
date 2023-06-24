# 1x-scraper
This project dumps all easily-scrapable metadata from 1x.com into an sqlite database. It scans all 7-digit integer ids in parallel with a configurable number of threads.

## Setup
```
npm install
```

## Run
```
node src/index.js
```
If you run it again after it's interrupted, it will pick up where it left off.