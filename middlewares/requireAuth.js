const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res
      .status(401)
      .json({ msg: "Hozz létre egy fiókot vagy jelentkezz be!" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { _id, isAdmin, email } = jwt.verify(token, process.env.SECRET);

    req.user = await User.findOne({ _id }).select("_id");
    req.isAdmin = isAdmin;
    res.locals.isAdmin = isAdmin;
    req.email = email;
    res.locals.email = email;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired" });
    } else {
      console.log(error);
      return res.status(500).json({ msg: "A kérés nincs hitelesítve!" });
    }
  }
};

module.exports = requireAuth;
