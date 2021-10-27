const query = require("./sources");

const getPapersBySearchQuery = async (searchQuery) => {
  console.log(`getPapersBySearchQuery`);

  const promises = [];
  promises.push(query("ACM", searchQuery));
  promises.push(query("arxiv", searchQuery));
  promises.push(query("IEEE", searchQuery));
  promises.push(query("ScienceDirect", searchQuery));
  promises.push(query("SpringerLink", searchQuery));
  const articles = await Promise.all(promises)



  console.log(`Articles:`);
  console.log(`ACM: ${articles[0].length}`);
  console.log(`arXiv.org: ${articles[1].length}`);
  console.log(`IEEE Xplore: ${articles[2].length}`);
  console.log(`Science Direct: ${articles[3].length}`);
  console.log(`Springer Link: ${articles[4].length}`);

  return articles;
};

const getPapersByKeyWords = (keywords = []) => {
  console.log(`QUERY - [${keywords.join(",")}]`);
};

module.exports = {
  getPapersBySearchQuery,
  getPapersByKeyWords,
};
