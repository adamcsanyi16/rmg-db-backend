const mongoose = require("mongoose");

const TanarSchema = new mongoose.Schema({
  nev: {
    type: String,
  },
});

module.exports = mongoose.model("teacher", TanarSchema);
