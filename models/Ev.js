const mongoose = require("mongoose");

const evSchema = new mongoose.Schema({
  ev: {
    type: String,
  },
});

module.exports = mongoose.model("year", evSchema);
