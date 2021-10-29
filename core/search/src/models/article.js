const mongoose = require("mongoose");
const { Schema } = mongoose;

const Article = Schema({
  source: { type: String, required: true },
  added: { type: Date, default: Date.now },
  doi: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  venue: { type: String },
  authors: [
    {
      type: String,
    },
  ],
  abstract: { type: String, required: true },
  publicationDate: { type: Date },
  citationCount: { type: Number },
});

// Compound index to force unqique papers within a source
Article.index({ source: 1, doi: 1}, { unique: true });

module.exports = mongoose.model("Article", Article)
