const { query, getPapers } = require("./sources/acm.js");

const getPapersBySearchQuery = async (searchQuery) => {
  console.log(`getPapersBySearchQuery`);
  const acmPapers = await getPapers(searchQuery);
}

const getPapersByKeyWords = (keywords = []) => {
  console.log(`QUERY - [${keywords.join(",")}]`)
}

module.exports = {
  getPapersBySearchQuery,
  getPapersByKeyWords,
};