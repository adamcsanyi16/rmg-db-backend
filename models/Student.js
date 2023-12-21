const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  nev: {
    type: String,
  },
});

module.exports = mongoose.model("student", studentSchema);
