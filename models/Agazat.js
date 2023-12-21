const mongoose = require("mongoose");

const agazatSchema = new mongoose.Schema(
  {
    agazat: {
      type: String,
    },
  },
);

module.exports = mongoose.model("agazat", agazatSchema);
