require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");

const requireAuth = require("./middlewares/requireAuth");

const User = require("./models/User");
const Race = require("./models/Competition");
const Comps = require("./models/Onlycomps");
const Agazat = require("./models/Agazat");
const Student = require("./models/Student");

//HTML EMAIL FOR REG
const htmlRegister = `
  <html>
    <head>
      <style>
        /* CSS styles for the email layout */
        body {
          font-family: Arial, sans-serif;
          background-color: #f1f1f1;
          padding: 20px;
        }
        .container {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 5px;
        }
        h1 {
          color: #333333;
          text-align: center;
        }
        p {
          color: #666666;
          line-height: 1.5;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Sikeres regisztráció</h1>
        <p>Sikeresen regisztráltál a Radnótis versenyeredmények oldalára</p>
        <!-- Add more HTML content here if needed -->
      </div>
    </body>
  </html>
`;

//RESET EMAIL FUNCTION
const sendEmail = ({ email, KOD }) => {
  const transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Jelszó helyreállítás",
    html: `
    <html>
      <head>
        <style>
          /* CSS styles for the email layout */
          body {
            font-family: Arial, sans-serif;
            background-color: #f1f1f1;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 5px;
          }
          h1 {
            color: #333333;
            text-align: center;
          }
          h2 {
            color: #333333;
            text-align: center;
            letter-spacing: 5px;
          }
          p {
            color: #666666;
            line-height: 1.5;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Jelszó Helyreállítás</h1>
          <p>A következő sorban kapott 4 számjegyű kódodat kell megadnod, hogy hitelesítsd magad!</p>
          <h2>${KOD}</h2>
        </div>
      </body>
    </html>
  `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Hiba az email küldésekor:", error.message);
    } else {
      console.log("Elküldve:", info.response);
    }
  });
};

//MULTER CONFIG
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//TOKEN CREATION
const createToken = (_id, isAdmin, email) => {
  return jwt.sign({ _id, isAdmin, email }, process.env.SECRET, {
    expiresIn: "8h",
  });
};

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//MAIN PAGE
app.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    console.log(users);
    res.render("admin.ejs", { users });
  } catch (error) {
    res.status(500).json({ msg: "Felhasználó hiba" });
  }
});

//REGISTER
app.post("/regisztral", async (req, res) => {
  try {
    const { email, jelszo, jelszoismetles } = req.body;
    const user = await User.signup(email, jelszo, jelszoismetles);

    const token = createToken(user._id, user.isAdmin, user.email);

    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Sikeres regisztráció",
      text: "Sikeresen regisztráltál a Radnótis versenyeredmények oldalára",
      html: htmlRegister,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Hiba az email küldésekor:", error.message);
      } else {
        console.log("Elküldve:", info.response);
      }
    });

    res.status(200).json({ msg: "Sikeres regisztráció", email, token });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

//LOGIN
app.post("/belepes", async (req, res) => {
  try {
    const { email, jelszo } = req.body;
    const user = await User.login(email, jelszo);
    const token = createToken(user._id, user.isAdmin, user.email);
    res.status(200).json({ msg: "Sikeres belépés", token });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

//RESET
app.post("/emailkuldes", async (req, res) => {
  try {
    const { email } = req.body;
    sendEmail(req.body);
    res.status(200).json({
      msg: `Az azonosító kód el lett küldve a(z) ${email} címre`,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

app.post("/valtoztat", async (req, res) => {
  try {
    const { universalEmail, jelszo, jelszoismetles } = req.body;
    await User.reset(universalEmail, jelszo, jelszoismetles);
    res.status(200).json({ msg: "Sikeresen megváltoztattad a jelszavad!" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

app.use(requireAuth);

//RESULTS
app.get("/eredmeny", async (req, res) => {
  try {
    const race = await Race.find({});
    res.status(200).json({ msg: race });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.post("/eredmeny", async (req, res) => {
  try {
    const {
      email,
      vtipus,
      vszint,
      verseny,
      agazat,
      vforma,
      helyezes,
      tanulok,
      osztaly,
      tanarok,
    } = req.body;
    const newRace = new Race({
      nev: email,
      vtipus,
      vszint,
      verseny,
      agazat,
      vforma,
      helyezes,
      tanulok,
      osztaly,
      tanarok,
    });
    await newRace.save();
    res.status(200).json({ msg: "Sikeres adat létrehozás!" });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.put("/eredmeny", async (req, res) => {
  try {
    const {
      paramId,
      nev,
      vtipus,
      vszint,
      verseny,
      agazat,
      vforma,
      helyezes,
      tanulok,
      osztaly,
      tanarok,
    } = req.body;

    await Race.findOneAndUpdate(
      { _id: paramId },
      {
        nev,
        vtipus,
        vszint,
        verseny,
        agazat,
        vforma,
        helyezes,
        tanulok,
        osztaly,
        tanarok,
      },
      { new: true }
    );
    res.status(201).json({ msg: "Sikeres adat módosítás!" });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt!" });
  }
});

app.delete("/eredmeny", async (req, res) => {
  try {
    const body = req.body;
    const toroltAdat = await Race.findOneAndDelete({ _id: body.id }).exec();
    console.log(toroltAdat);
    if (toroltAdat) {
      res.status(200).json({ msg: "Sikeres adat törlés!" });
    } else {
      res.status(404).json({ msg: "A felhasználó nem található!" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt!" });
  }
});

app.post("/eredmenyMent", async (req, res) => {
  try {
    const dataArray = req.body.filteredResults;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    const headerRow = Object.keys(dataArray[0]).filter(
      (key) => !["_id", "nev", "createdAt", "updatedAt", "__v"].includes(key)
    );
    worksheet.addRow(headerRow);

    dataArray.forEach((data) => {
      const values = Object.keys(data)
        .filter(
          (key) =>
            !["_id", "nev", "createdAt", "updatedAt", "__v"].includes(key)
        )
        .map((key) => data[key]);
      worksheet.addRow(values);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.post("/sajatEredmeny", async (req, res) => {
  try {
    const { email } = req.body;
    const myEredmeny = await Race.find({ nev: email });
    res.status(200).json({ msg: myEredmeny });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.get("/verseny", async (req, res) => {
  try {
    const comps = await Comps.find({});
    res.status(200).json({ comps });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.post("/verseny", async (req, res) => {
  try {
    const { verseny } = req.body;
    const newComp = new Comps({
      verseny,
    });
    await newComp.save();
    res.status(200).json({ msg: "Sikeres verseny létrehozás!" });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.post("/uploadVerseny", upload.single("file"), async (req, res) => {
  try {
    const fileContent = req.file.buffer.toString();
    const versenyek = fileContent.split(";").map((verseny) => ({ verseny }));

    await Comps.insertMany(versenyek);

    res.status(200).send({ msg: "Sikeres verseny feltöltés!" });
  } catch (error) {
    res.status(500).send({ msg: "Valami hiba történt" + error.message });
  }
});

app.get("/agazat", async (req, res) => {
  try {
    const agazat = await Agazat.find({});
    res.status(200).json({ agazat });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.post("/agazat", async (req, res) => {
  try {
    const { agazat } = req.body;
    const newAgazat = new Agazat({
      agazat,
    });
    await newAgazat.save();
    res.status(200).json({ msg: "Sikeres ágazat létrehozás!" });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.post("/uploadAgazat", upload.single("file"), async (req, res) => {
  try {
    const fileContent = req.file.buffer.toString();
    const agazatok = fileContent.split(";").map((agazat) => ({ agazat }));

    await Agazat.insertMany(agazatok);

    res.status(200).send({ msg: "Sikeres ágazat feltöltés!" });
  } catch (error) {
    res.status(500).send({ msg: "Valami hiba történt" + error.message });
  }
});

app.get("/student", async (req, res) => {
  try {
    const student = await Student.find({});
    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.post("/student", async (req, res) => {
  try {
    const { nev } = req.body;
    const newStudent = new Student({
      nev,
    });
    await newStudent.save();
    res.status(200).json({ msg: "Sikeres tanuló feltöltés!" });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt" + error.message });
  }
});

app.post("/uploadStudent", upload.single("file"), async (req, res) => {
  try {
    const fileContent = req.file.buffer.toString();
    const students = fileContent.split(";").map((nev) => ({ nev }));

    await Student.insertMany(students);

    res.status(200).send({ msg: "Sikeres volt a tanulók feltöltése!" });
  } catch (error) {
    res.status(500).send({ msg: "Valami hiba történt" + error.message });
  }
});

app.get("/isAdmin", async (req, res) => {
  try {
    const isAdmin = res.locals.isAdmin;
    const email = res.locals.email;
    res.status(200).json({ isAdmin, email });
  } catch (error) {
    res.status(500).json({ msg: "Valami hiba történt: " + error.message });
  }
});

const port = process.env.PORT || 3500;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Sikeres adatbázis elérés!"))
  .catch(() => console.log(error.message));

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
