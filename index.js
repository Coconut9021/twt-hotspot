import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';


import pool, { 
    authenticateUser, 
    authenticateAdmin,
    authenticateToken,
    insertUserData, 
    deleteUser,
    showDatabase,
    checkAdmin,
    // testConnection
} from './database.js';

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.post("/", (req, res) => {
  res.render("index.ejs");
})

app.post("/login", async (req, res) => {
    const data  = req.body
    const email = data.email
    const authStatus = await authenticateUser(email)
    if (authStatus == true) {
        res.render('alogin.ejs', {
            email
        })    
    } else {
        insertUserData(data);
        res.render('alogin.ejs', {
            email
        })
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie('token');
    res.redirect('/admin');
});

app.post("/alogin", (req, res) => {
    try {
        res.render('alogin.ejs');

    } catch (error) {
        console.error('Error loading the redirect page:', error)
        res.status(500).send('error rendering page', {
            message: 'Failed to load redirect page'
        })
    }
})

app.get("/admin", (req, res) => {
    res.render("admin.ejs");
});

app.post("/admin", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: "Username and password are required"
            });
        }

        const isAuthenticated = await authenticateAdmin(username, password);

        if (isAuthenticated) {
            const user = { name: username };
            const accessToken = jwt.sign(user, process.env.USER_ACCESS_TOKEN)

            // Set token as HTTP-only cookie
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            return res.json({
                success: true,
                redirect: '/admin/dashboard'
            });
        }

        return res.status(401).json({
            success: false,
            error: "Invalid credentials"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Add this GET route for the dashboard
app.post("/admin/dashboard", authenticateToken, async (req, res) => {
    try {
        // Verify admin role
        const isAdmin = await checkAdmin(req.user.name);
        if (!isAdmin) {
            return res.status(403).send('Forbidden');
        }

        const { fullData, groups, dataUsage } = await showDatabase();
        res.render("dashboard.ejs", {
            fullData,
            groups,
            dataUsage
        });
    } catch (error) {
        console.error('Error loading admin page:', error);
        res.status(500).send('Server Error');
    }
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
            res.render("admin.ejs");
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

