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

app.post("/login", (req, res) => {
  res.render("index.ejs");
})

app.post('/submit-form', async (req, res) => {
    // const { email } = req.body;   
    // authenticateUser(email, (err, success) =>{
    //    if (err || !success) {
    //     console.log(err) 
    //     return res.status(401).send('Invalid credentials'); 
    //    }
    //    // Grant network access (FreeRADIUS handles this)
    //     res.redirect('/registered');
    // });
    res.redirect('/')
});

app.post("/registered", (req, res) => {
    try {
        res.render('registered.ejs');

    } catch (error) {
        console.error('Error loading success page:', error)
        res.status(500).send('error rendering page', {
            message: 'Failed to load success page'
        })
    }
}) 

app.post("/returning", (req, res) => {
    try {
        res.render('returning.ejs');

    } catch (error) {
        console.error('Error loading sucreturningcess page:', error)
        res.status(500).send('error rendering page', {
            message: 'Failed to load returning page'
        })
    }
}) 
app.post("/admin", async (req, res) => {
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
        
        if (result.success) {
            res.redirect("/admin");
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to delete user'
            });
        }
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
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

// // RADIUS authentication endpoint (for API)
// app.post("/api/auth", async (req, res) => {
//     try {
//         const { email } = req.body;
//         const authResult = await authenticateUser(email);
        
//         if (authResult.success) {
//               res.redirect('/success');

//         } else {
//               res.render('error.ejs');

//         }
//     } catch (error) {
//         console.error('Auth error:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Internal server error' 
//         });
//     }
// });


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

