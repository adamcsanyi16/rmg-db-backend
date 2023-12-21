const mongoose = require("mongoose");

const compSchema = new mongoose.Schema(
  {
    nev: {
      type: String,
      required: true,
    },
    vtipus: {
      type: String,
      required: true,
    },
    vszint: {
      type: String,
      required: true,
    },
    verseny: {
      type: String,
      required: true,
    },
    agazat: {
      type: String,
      required: true,
    },
    vforma: {
      type: String,
      required: true,
    },
    helyezes: {
      type: String,
      required: true,
    },
    tanulok: {
      type: String,
      required: true,
    },
    osztaly: {
      type: String,
      default: "-",
    },
    tanarok: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("competition", compSchema);
