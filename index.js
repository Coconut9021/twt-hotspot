import express from 'express';
import pool, { 
    authenticateUser, 
    insertUserData, 
    deleteUser,
    showDatabase,
    checkAdmin,
    // testConnection
} from './database.js';

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index.ejs");
})

app.post('/submit-form', async (req, res) => {
    const data = req.body;
    console.log('Form data received:', data);
    try {
        const auth = await authenticateUser(data.email);
        
        if (auth.success) {
            console.log('User authenticated successfully:', auth);
            try {
                res.redirect("/check-admin")
            } catch (error) {
                res.status(500).send('error redirecting you to admin', { 
            message: error.message || 'Failed to confirm role' 
        });
            }
            res.redirect('/success');
        } else {
            const formData = req.body;
            await insertUserData(formData);
            console.log('User registered successfully:');
            res.render('success.ejs');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('error message', { 
            message: error.message || 'Failed to process form submission' 
        });
    }
});

app.get("/admin", async (req, res) => {
    try {
        const { fullData, groups } = await showDatabase();
        res.render("admin.ejs", { 
            fullData, 
            groups 
        });
    } catch (error) {
        console.error('Error loading admin page:', error);
        res.status(500).send('error confirming role',{ 
            message: 'Failed to load admin data' 
        });
    }
});

app.post("/check-admin", async (req, res) => {
    const isAdmin = checkAdmin(req.body.email);
    if (isAdmin == true){
        res.render('admin.ejs')
    } else {
        res.redirect('success.ejs')
    }
    
});

app.post('/delete-user', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email is required' 
            });
        }

        const result = await deleteUser(email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// app.post("/api/test", (req, res) => {
//     const { username, password } = req.body;
//     testConnection(username, password)
//         .then(result => {
//             res.json({ success: true, message: 'Connection successful', result });
//         })
//         .catch(error => {
//             console.error('Test connection error:', error);
//             res.status(500).json({ 
//                 success: false, 
//                 message: 'Connection failed', 
//                 error: error.message 
//             });
//         });
// });

// RADIUS authentication endpoint (for API)
app.post("/api/auth", async (req, res) => {
    try {
        const { email } = req.body;
        const authResult = await authenticateUser(email);
        
        if (authResult.success) {
              res.redirect('/success');

        } else {
              res.render('error.ejs');

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
  res.render('success.ejs');
}) 

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

