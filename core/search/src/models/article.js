const mongoose = require("mongoose");
const { Schema } = mongoose;

const Article = Schema({
  source: { type: String, required: true },
  added: { type: Date, default: Date.now },
  doi: String,
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  venue: { type: String },
  authors: [
    {
      type: String,
    },
  ],
  abstract: { type: String },
  publicationDate: { type: Date },
  citationCount: { type: Number },
});

Article.index({ source: 1, doi: 1}, { unique: true });

module.exports = mongoose.model("Article", Article)
