const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const jwt = require('jsonwebtoken');
const multer = require("multer");
const path = require("path");
const cookieParser = require('cookie-parser');



const app = express();
const port = 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views directory
app.set("views", __dirname + "/views");

// MongoDB Connection URI
const uri = "mongodb+srv://kavyajain1916:K12345678@cluster0.vmxlebi.mongodb.net/VTOP";
const dbName = "VTOP";

// Use cookie parser middleware
app.use(cookieParser());

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (like index.html)
app.use(express.static("public"));
// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Function to generate a random JWT secret
function generateJWTSecret() {
    return require('crypto').randomBytes(64).toString('hex');
}

// Function to authenticate user
async function authenticateUser(username, password) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("VTOP");
        const user = await db.collection("studentCred").findOne({ username });

        if (!user) {
            return false; // User not found
        }

        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? user : false; // Return user if password matches, otherwise false
    } catch (err) {
        console.error("Error authenticating user:", err);
        return false;
    } finally {
        await client.close();
    }
}
async function authenticateAdmin(username, password) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("VTOP");
        const user = await db.collection("Admin").findOne({ username });

        if (!user) {
            return false; // User not found
        }

        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? user : false; // Return user if password matches, otherwise false
    } catch (err) {
        console.error("Error authenticating user:", err);
        return false;
    } finally {
        await client.close();
    }
}
// Handle POST requests to /login
app.post("/student/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = await authenticateUser(username, password);
    if (user) {
        // If authentication is successful, generate JWT token
        const jwtSecret = generateJWTSecret();
        const token = jwt.sign({ username: user.username }, jwtSecret);

        // Store token in cookie
        res.cookie('token', token);

        // Store user-specific JWT secret in the database
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await client.connect();
            const db = client.db("VTOP");
            await db.collection("studentCred").updateOne({ username }, { $set: { jwtSecret } });
        } catch (err) {
            console.error("Error storing JWT secret:", err);
        } finally {
            await client.close();
        }

        res.redirect(`/profile/student/${username}`);
    } else {
        // If authentication fails, redirect back to login page
        res.redirect("http://127.0.0.1:5500/studentLogin.html");
    }
});
app.post("/Admin/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = await authenticateAdmin(username, password);
    if (user) {
        // If authentication is successful, generate JWT token
        const jwtSecret = generateJWTSecret();
        const token = jwt.sign({ username: user.username }, jwtSecret);

        // Store token in cookie
        res.cookie('token', token);

        // Store user-specific JWT secret in the database
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await client.connect();
            const db = client.db("VTOP");
            await db.collection("Admin").updateOne({ username }, { $set: { jwtSecret } });
        } catch (err) {
            console.error("Error storing JWT secret:", err);
        } finally {
            await client.close();
        }

        res.redirect(`/profile/Admin/${username}`);
    } else {
        // If authentication fails, redirect back to login page
        res.redirect("http://127.0.0.1:5500/Admin.html");
    }
});
// Middleware function to verify JWT token
async function verifyToken(req, res, next) {
    const token = req.cookies.token;
    const username = req.params.username;

    if (!token) {
        return res.status(401).redirect("http://127.0.0.1:5500/index.html");
    }

    try {
        // Retrieve user-specific JWT secret from the database
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db("VTOP");
        const user = await db.collection("studentCred").findOne({ username });
        await client.close();

        if (!user || !user.jwtSecret) {
            throw new Error("User not found or JWT secret not set");
        }

        // Verify the JWT token using the user-specific secret
        jwt.verify(token, user.jwtSecret);

        // Attach the decoded payload to the request object
        req.user = { username };
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        // If token is invalid, return 403 Forbidden
        return res.status(403).redirect("http://127.0.0.1:5500/index.html");
    }
}
async function verifyAdminToken(req, res, next) {
    const token = req.cookies.token;
    const username = req.params.username;

    if (!token) {
        return res.status(401).redirect("http://127.0.0.1:5500/index.html");
    }
    try {
        // Retrieve user-specific JWT secret from the database
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db("VTOP");
        const user = await db.collection("Admin").findOne({ username });
        await client.close();

        if (!user || !user.jwtSecret) {
            throw new Error("User not found or JWT secret not set");
        }

        // Verify the JWT token using the user-specific secret
        jwt.verify(token, user.jwtSecret);

        // Attach the decoded payload to the request object
        req.user = { username };
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        // If token is invalid, return 403 Forbidden
        return res.status(403).redirect("http://127.0.0.1:5500/index.html");
    }
}
app.post('/addStudent', async (req, res) => {
    try {
        // Extract student data from the request body
        const { name, branch, admissionYear } = req.body;

        // Generate student ID
        const branchCode = branch.substring(0, 3).toUpperCase();
        const yearCode = admissionYear.toString().substring(2);

        // Create a new MongoDB client
        const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

        // Connect to MongoDB
        await client.connect();

        // Get the studentAdm collection
        const studentAdmCollection = client.db().collection('studentAdm');

        // Get the studentCred collection
        const studentCredCollection = client.db().collection('studentCred');

        // Generate student ID
        const existingStudentsCount = await studentAdmCollection.countDocuments({ branch: branchCode, admissionYear: admissionYear });
        const sequenceNumber = pad(existingStudentsCount + 1, 4);
        const studentId = `${yearCode}${branchCode}${sequenceNumber}`;

        // Generate random password
        const password = generateRandomPassword();

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new student admission document
        const newStudentAdm = {
            name: name,
            branch: branch,
            admissionYear: admissionYear,
            id: studentId
        };

        // Save student admission document to the database
        await studentAdmCollection.insertOne(newStudentAdm);

        // Create a new student credentials document
        const newStudentCred = {
            studentId: studentId,
            username: studentId, // Use student ID as username
            password: hashedPassword
        };

        // Save student credentials document to the database
        await studentCredCollection.insertOne(newStudentCred);

        // Log the actual password
        console.log(`Password for student ID ${studentId}: ${password}`);

        // Close the MongoDB connection
        await client.close();

        // Send response
        res.status(200).json({ message: 'Student added successfully' });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Utility function to generate a random password
function generateRandomPassword() {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Utility function to pad a number with leading zeros
function pad(number, length) {
    let str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}
// Handle GET requests to /profile/student/:username
app.get("/profile/student/:username", verifyToken, async (req, res) => {
    const username = req.params.username;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db("VTOP");
        const userData = await db.collection("studentAdm").findOne({ id: username });

        if (userData) {
            // If user data is found, render the profile page with user's information
            res.render("profile", { user: userData });
        } else {
            // If user data is not found, render an error page
            res.render("error", { message: "User not found" });
        }
    } catch (err) {
        console.error("Error retrieving user data:", err);
        res.render("error", { message: "Internal Server Error" });
    } finally {
        await client.close();
    }
});
 
// Handle POST requests to /requestNightslip
app.post("/requestNightslip", async (req, res) => {
    const { fromDate, toDate, fromTime, toTime } = req.body;

    // Retrieve student's username from the JWT token in the cookie
    const token = req.cookies.token;
    const decodedToken = jwt.verify(token, jwtSecret);
    const username = decodedToken.username;

    // Fetch the student's ID from the database based on the username
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db("VTOP");
        const student = await db.collection("studentCred").findOne({ username });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        const studentId = student.id;

        // Create a new nightslip document
        const nightslip = new Nightslip({
            studentId,
            fromDate,
            toDate,
            fromTime,
            toTime
        });

        // Save the nightslip to the database
        await nightslip.save();

        res.status(200).json({ message: "Nightslip request submitted successfully" });
    } catch (err) {
        console.error("Error handling nightslip request:", err);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await client.close();
    }
});

app.get("/profile/Admin/:username", verifyAdminToken, async (req, res) => {
    const username = req.params.username;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db("VTOP");
        const userData = await db.collection("Admin").findOne({ username: username });
        if (userData) {
            // If user data is found, render the profile page with user's information
            res.render("Admprofile", { user: userData });
        } else {
            // If user data is not found, render an error page
            res.render("error", { message: "User not found" });
        }
    } catch (err) {
        console.error("Error retrieving user data:", err);
        res.render("error", { message: "Internal Server Error" });
    } finally {
        await client.close();
    }
});
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "uploads")); // Destination directory for uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); // Use original filename for uploaded files
    }
  });
  
  // Multer upload instance with storage configuration
  const upload = multer({ storage });
  
  // Middleware to parse JSON bodies
  app.use(bodyParser.json());
  
  // Middleware to serve static files (e.g., uploaded images)
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  
  // Function to connect to MongoDB
  async function connectToDatabase() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    return client.db();
  }
  
  // Route to handle adding news
  // Route to handle adding news
app.post("/addNews", upload.single("image"), async (req, res) => {
    const db = await connectToDatabase();
    const newsCollection = db.collection("news");
  
    // Extract news data from request body
    const { title, description,photoUrl } = req.body;
    
    // Generate Google Drive link for the uploaded image
   
  
    // Create news object
    const news = {
      title,
      description,
      photoUrl
    };
  
    // Insert news into the database
    try {
      const result = await newsCollection.insertOne(news);
      res.json({ success: true, message: "News added successfully", news: result.ops[0] });
    } catch (error) {
      console.error("Error adding news:", error);
      res.status(500).json({ success: false, message: "Failed to add news" });
    }
  });
  
  app.get('/profile', (req, res) => {
  // Get the current date
  const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Render the profile template with the currentDate variable
  res.render('profile', { currentDate: currentDate });
});
  // Route to handle retrieving news
  app.get("/getAllStudents", async (req, res) => {
    const db = await connectToDatabase("mongodb+srv://kavyajain1916:K12345678@cluster0.vmxlebi.mongodb.net");
    const studentCollection = db.collection("studentAdm");
  
    // Retrieve all news from the database
    try {
      const studData = await studentCollection.find({}).toArray();
      res.json(studData);
    } catch (error) {
      console.error("Error retrieving news:", error);
      res.status(500).json({ message: "Failed to retrieve news" });
    }
  });
  app.delete(`/removeNewsByTitle/:title`, async (req, res) => {
    const { title } = req.params;
    const client = new MongoClient("mongodb+srv://kavyajain1916:K12345678@cluster0.vmxlebi.mongodb.net", { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("bhdhdhdhhdhdhdhddhhdhdhdhdhddhdhdhdhhdhdhdhdhhdhdhddhhhhhhhdhhdhdhdhdhhdhddhhdhhd")
    try {
        await client.connect();
        const db = client.db("VTOP");
        const collection = db.collection('news');

        const result = await collection.deleteOne({ title:title });

        if (result.deletedCount === 0) {
            res.status(404).json({ success: false, message: 'News not found' });
        } else {
            res.json({ success: true, message: 'News removed successfully' });
        }
    } catch (error) {
        console.error('Error removing news:', error);
        res.status(500).json({ success: false, message: 'Failed to remove news' });
    } finally {
        await client.close();
    }
});


  app.get("/getNews", async (req, res) => {
    const db = await connectToDatabase();
    const newsCollection = db.collection("news");
  
    // Retrieve all news from the database
    try {
      const newsData = await newsCollection.find({}).toArray();
      res.json(newsData);
    } catch (error) {
      console.error("Error retrieving news:", error);
      res.status(500).json({ message: "Failed to retrieve news" });
    }
  });

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
