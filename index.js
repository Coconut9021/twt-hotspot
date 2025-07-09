import express from 'express';
import pool, { 
    authenticateUser, 
    insertUserData, 
    deleteUser,
    showDatabase,
} from './database.js';

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index.ejs");
})

app.post("/submit-form", async (req, res) => {
    console.log('form submission received:');
    try {
        const formData = req.body;
        await insertUserData(formData);
        res.render('success.ejs', { username: formData.email });
    } catch (error) {
        console.error('Form submission error:', error);
        res.status(500).render('error.ejs', { message: 'Failed to process form submission' });
    }
});

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

// RADIUS authentication endpoint (for API)
app.post("/api/auth", async (req, res) => {
    try {
        const { username, password } = req.body;
        const authResult = await authenticateUser(username, password);
        
        if (authResult.success) {
            res.json({
                success: true,
                username: authResult.username,
                groups: authResult.groups
            });
        } else {
            res.status(401).json({
                success: false,
                message: authResult.message || 'Authentication failed'
            });
        }
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post("/success", (req, res) => {
  const data = req.body;
  console.log(data)
  res.render('success.ejs');
}) 

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

