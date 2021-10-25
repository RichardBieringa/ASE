const client = require("../httpClient.js");
const cheerio = require("cheerio");

// Amount of results to show per page
const PAGE_SIZE = 100;
// Base URL for the digital library
const BASE_URL = "https://dl.acm.org/action/doSearch";

const MAX_ATTEMPTS = 5;
const TIMEOUT = 2000;

// Queries all pages of the library
const getPapers = async (searchQuery, pageSize = PAGE_SIZE) => {
  const papers = [];

  let page = 0;
  let attempt = 1;

  let result;
  do {
    try {
      result = await query(searchQuery, page, pageSize);
    } catch(err) {
      console.error(`ERROR (attempt: ${attempt}): ${err.message}`);
      await new Promise(r => setTimeout(r, TIMEOUT));
      attempt++
      continue;
    }

    papers.push(...result.papers);
    page++;
  } while (result && result.hasNext && attempt <= MAX_ATTEMPTS)
  console.log(`Queried ${page} pages, got ${papers.length} papers`);

  


  return papers;
}

// Queries a single page
const query = async (searchQuery, page = 0, pageSize = PAGE_SIZE) => {
  const url = `${BASE_URL}/?AllField=${searchQuery}&startPage=${page}&pageSize=${pageSize}`

  console.log(`GET - ${url}`);
  try {
    const response = await client.get(url);
    const result = parsePage(response.data);
    return result;
  } catch(err) {
    throw err;
  }
}

// Extracts the data from a query page
const parsePage = (pageHTML) => {
  const result = {
    papers: [],
    hasNext: false,
  }

  const papers = [];

  const $ = cheerio.load(pageHTML);

  const searchResults = $(".search__item .issue-item__title a");
  $(searchResults).each((i, el) => {$(el).attr("href")});

  console.log("results:")
  console.log(searchResults)

  for (let result of searchResults) {
    const href = $(result).attr("href");
    console.log(href);
    papers.push(href);
  }

  const next = $(".pagination__btn--next");
  if (next.length) result.hasNext = true;

  return result;
}

const parsePaper = async (paperId) => {

}

module.exports = {
  getPapers
}