const mongoose = require("mongoose");

const osztalySchema = new mongoose.Schema({
  osztaly: {
    type: String,
  },
});

module.exports = mongoose.model("class", osztalySchema);
