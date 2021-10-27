const queryACM = require("./acm.js");
const queryArxiv = require("./arxiv");
const queryIEEE = require("./ieee.js");
const queryScienceDirect = require("./scienceDirect.js");
const querySpringerLink = require("./spiringerLink.js");

const query = async (source, searchQuery) => {
  switch(source) {
    case "ACM":
      return await queryACM(searchQuery);
      break;
    case "arxiv":
      return await queryArxiv(searchQuery);
      break;
    case "IEEE":
      return await queryIEEE(searchQuery);
      break;
    case "ScienceDirect":
      return await queryScienceDirect(searchQuery);
      break;
    case "SpringerLink":
      return await querySpringerLink(searchQuery);
      break;
    default:
      console.error(`Unsupported source: ${source}`);
      return null;
  }
}

module.exports = query;