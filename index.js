require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
// const prisma = require('./lib/db');
// const { mail } = require('./lib/nodemailer');
// const { generateTwoFactorToken } = require('./lib/token');
// const { getTwoFactorTokenByEmail } = require('./data');
// const db = require('./db');

const app = express();

app.use(express.static("public"));

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.post("/", (req, res) => {
  console.log(req.body);
  return res.render("./");
});

app.get("*", (req, res) => {
  res.redirect("https://google.com");
});

const PORT = process.env.PORT || 8444;

app.listen(PORT, () => {
  console.log("server running at http://localhost:8444");
});
