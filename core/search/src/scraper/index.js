const { acm } = require("./sources");

const getPapersBySearchQuery = async (searchQuery) => {
  console.log(`getPapersBySearchQuery`);
  const articles = {
    acm: [],
    arxiv: [],
    ieee: [],
    scienceDirect: [],
    springer: [],
    wiley: [],
  };

  // Scrape all electronic DBs
  articles.acm = await acm(searchQuery);
  // articles.arxiv = await arxiv(searchQuery);
  // articles.ieee = await ieee(seachQuery);
  // articles.scienceDirect = await scienceDirect(searchQuery);
  // articles.springer = await spinger(searchQuery);
  // articles.wiley = await wiley(searchQuery);


  console.log(`Articles:`);
  console.log(`ACM: ${articles.acm.length}`);
  console.log(`arXiv.org: ${articles.arxiv.length}`);
  console.log(`IEEE Xplore: ${articles.ieee.length}`);
  console.log(`Science Direct: ${articles.scienceDirect.length}`);
  console.log(`Springer Link: ${articles.springer.length}`);
  console.log(`Wiley Online Library: ${articles.wiley.length}`);

  return articles;
}

const getPapersByKeyWords = (keywords = []) => {
  console.log(`QUERY - [${keywords.join(",")}]`)
}

module.exports = {
  getPapersBySearchQuery,
  getPapersByKeyWords,
};