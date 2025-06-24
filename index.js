import express from 'express';
import bodyParser from 'body-parser';
import pool, { database, insertUserData } from './database.js' ;
const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("/public"));

app.get("/", (req, res) => {
  res.render("index.ejs");

})

app.get("/admin", async (req, res) => {
  const data = await database();
  res.render("admin.ejs", { data });
})

app.post("/success", (req, res) => {
  const data = req.body;
  insertUserData(data);
  res.render('success.ejs');
}) 

// app.get("/{*splat}", (req, res) => {
//    res.redirect("https://google.com");
//  });

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

