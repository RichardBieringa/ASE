const queryACM = require("./acm.js");
const queryArxiv = require("./arxiv");
const queryIEEE = require("./ieee.js");
const queryScienceDirect = require("./scienceDirect.js");
const querySpringerLink = require("./spiringerLink.js");
const queryWiley = require("./wiley.js");

module.exports = {
  queryACM,
  queryArxiv,
  queryIEEE,
  queryScienceDirect,
  querySpringerLink,
  queryWiley,
}