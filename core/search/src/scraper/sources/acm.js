const cheerio = require("cheerio");
const axios = require("../axiosWrapper.js");

const Article = require("../../models/article");

const SOURCE = "ACM";

const PAGE_SIZE = 25;
const TIMEOUT = 1000;

const HOSTNAME = "https://dl.acm.org";

const query = async (searchQuery, pageSize = PAGE_SIZE) => {
  const articles = [];

  let page = 0;
  let searchResults = null;

  do {
    searchResults = await getSearchResults(searchQuery, page, pageSize);
    const { articleUrls } = searchResults;

    for (let url of articleUrls) {
      const article = await getArticle(url);
      articles.push(article)

      // pls no ban
      await new Promise(resolve => setTimeout(resolve, TIMEOUT));
    }

    page++;
  } while (searchResults && searchResults.hasNext)
  console.log(`Queried ${page} pages, got ${articles.length} articles`);

  return articles;
}

// Gets a single page of search results, returns the SERP results
const getSearchResults = async (searchQuery, page, pageSize) => {
  // The API endpoint for querying papers
  const endpoint = `${HOSTNAME}/action/doSearch`;

  // Build the request
  const url = `${endpoint}/?AllField=${encodeURIComponent(searchQuery)}&startPage=${page}&pageSize=${pageSize}`

  console.log(`GET - ${url}`);
  try {
    const response = await axios.get(url);
    const result = parseResultPage(response.data);
    return result;
  } catch(err) {
    console.error(err.message);
    process.exit(1);
    throw err;
  }
}

// Extracts the data from a query page
const parseResultPage = (pageHTML) => {
  const result = {
    articleUrls: [],
    hasNext: false,
  }

  // Parse the Page HTML
  const $ = cheerio.load(pageHTML);

  // Extracts the urls for each search result
  const searchEntries = $(".search__item .issue-item__title a");
  for (let entry of searchEntries) {
    const path = $(entry).attr("href");
    const url = `${HOSTNAME}${path}`
    result.articleUrls.push(url);
  }

  // Check if there is another page of search results after this one
  const next = $(".pagination__btn--next");
  if (next.length) result.hasNext = true;

  return result;
}

const getArticle = async (url) => {
  console.log(`GET - ${url}`);
  try {
    const response = await axios.get(url);
    const result = parseArticlePage(response.data, url);
    return result;
  } catch(err) {
    console.error(err.message);
    process.exit(1);
    throw err;
  }
}


const parseArticlePage = async (pageHTML, url) => {
  // Parse the Page HTML
  const $ = cheerio.load(pageHTML);

  const doi = url.split("/doi/").pop();
  const title = $(".citation .issue-heading").text();
  const type = $(".citation .citation__title").text();
  const venue = $(".citation .epub-section__title").text();
  const authors = [];
  $(".citation .loa__author-info .loa__author-name").each((i, el) => authors.push($(el).text()));
  const abstract = $(".article__body .article__abstract .abstractInFull p").text();
  const publicationDate = new Date($(".citation .CitationCoverDate").text());

  const article = new Article({
    source: SOURCE,
    doi,
    url,
    title,
    type,
    venue,
    authors,
    abstract,
    publicationDate,
  });

  try {
    // Save it to DB
    await article.save();
  } catch(err) {
    if (err.code === 11000) {
      console.error("Duplicate entry, skipping...")
    }
  }

  return article;
}

module.exports = query;