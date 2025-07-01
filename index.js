import express from 'express';
import bodyParser from 'body-parser';
import radius from 'radius';
import dgram from 'dgram';
import pool, { showDatabase, insertUserData, deleteUser } from './database.js' ;
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
    try {
        const data = await showDatabase();
        res.render("admin.ejs", { data });
    } catch (error) {
        console.error('Error loading admin page:', error);
        res.status(500).send('Error loading admin page');
    }
});

app.post('/delete-user', async (req, res) => {
    try {
        const { fullName, email } = req.body;
        
        if (!fullName || !email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Name and email are required' 
            });
        }

        const result = await deleteUser(fullName, email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post("/success", (req, res) => {
  const data = req.body;
  insertUserData(data);
  res.render('success.ejs');
}) 

app.post("/send-radius", (req, res) => { 
    
 });
  
// app.get("/{*splat}", (req, res) => {
//    res.redirect("https://google.com");
//  });

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

