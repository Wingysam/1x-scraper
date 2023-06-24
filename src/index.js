import fetch from 'node-fetch'
import { load as cheerio } from 'cheerio'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const MAX_ID = 1e+7 - 1
const THREAD_COUNT = Number(process.env.THREAD_COUNT ?? 4)
const DATA_DIRECTORY = 'data'
const DB_LOCATION = path.join(DATA_DIRECTORY, '1x.sqlite')

let currentId = 0

fs.mkdirSync(DATA_DIRECTORY, { recursive: true })
const db = new Database(DB_LOCATION)
db.pragma('journal_mode = WAL')
let addToDb

async function main() {
  await initializeDb()
  for (let i = 0; i < THREAD_COUNT; i++) {
    Thread()
  }
}

async function initializeDb() {
  try {
    db.exec(`
      CREATE TABLE "images" (
        "id"	INTEGER NOT NULL UNIQUE,
        "image" TEXT NOT NULL,
        "title"	TEXT NOT NULL,
        "artist"	TEXT NOT NULL,
        PRIMARY KEY("id")
      );
    `)
  } catch {} // already exists
  addToDb = db.prepare('INSERT INTO "images" ("id", "image", "title", "artist") VALUES (@id, @image, @title, @artist);')
  currentId = db.prepare('SELECT MAX(id) AS current_id FROM "images"').get().current_id
}

async function Thread() {
  while (currentId < MAX_ID) {
    currentId++
    const id = currentId
    await attemptToSaveImage(id)
  }
}

async function attemptToSaveImage(id) {
  try {
    const data = await getData(id)
    console.log(id, data)
    addToDb.run({ id, ...data })
  } catch (error) {
    console.log(id, `${error}`)
  }
}

async function getData(id) {
  const html = await getHtml(id)
  const $ = cheerio(html)

  const image = $(`#img-${id}`).attr('src')
  if (!image) throw new Error('No image')
  const title = $('.photos-feed-data-title').first().text()
  const artist = $('.photos-feed-data-name').first().text()

  return { image, title, artist }
}

const BASE_URL = 'https://1x.com/photo/'
async function getHtml(id) {
  const url = BASE_URL + id
  const response = await fetch(url)
  const html = await response.text()
  return html
}

main()