const mongoose = require("mongoose");

const onlycompsSchema = new mongoose.Schema(
  {
    verseny: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("onlycomps", onlycompsSchema);
