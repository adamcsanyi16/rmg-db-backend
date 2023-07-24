require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Race = require("./models/Competition");
const Comps = require("./models/Onlycomps");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const requireAuth = require("./middlewares/requireAuth");
const Agazat = require("./models/Agazat");

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

//TOKEN CREATION
const createToken = (_id, isAdmin) => {
  return jwt.sign({ _id, isAdmin }, process.env.SECRET, {
    expiresIn: "3h",
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

    const token = createToken(user._id, user.isAdmin);
    console.log({ email, token });

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
    const token = createToken(user._id, user.isAdmin);
    console.log(email, token);
    res.status(200).json({ msg: "Sikeres belépés", email, token });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

//RESET
app.post("/emailkuldes", async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);
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

//RACE
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
    console.log(req.body);
    const newRace = new Race({
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

app.get("/isAdmin", async (req, res) => {
  try {
    const isAdmin = res.locals.isAdmin;
    res.status(200).json({ isAdmin });
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
