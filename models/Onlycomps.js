const mongoose = require("mongoose");

const onlycompsSchema = new mongoose.Schema({
  verseny: {
    type: String,
  },
});

module.exports = mongoose.model("onlycomps", onlycompsSchema);
