const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Connection URI
const uri = 'mongodb+srv://kavyajain1916:K12345678@cluster0.vmxlebi.mongodb.net/VTOP'; // Change this to your MongoDB URI

// Database Name
const dbName = 'VTOP';

// Generate a random password
function generatePassword() {
    return Math.random().toString(36).slice(-8); // Generates a random 8-character alphanumeric password
}

// Function to hash a password
async function hashPassword(password) {
    const saltRounds = 10; // Number of salt rounds
    return bcrypt.hash(password, saltRounds);
}

// Function to generate student credentials
async function generateStudentCredentials() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to MongoDB
        await client.connect();
        console.log('Connected to MongoDB.');

        // Get the database
        const db = client.db(dbName);

        // Get student IDs from studentAdm collection
        const students = await db.collection('studentAdm').find({}, { projection: { _id: 0, id: 1 } }).toArray();
        console.log('Retrieved students:', students);

        // Generate credentials for each student and insert into studentCred collection
        const studentCredentials = [];

        for (const student of students) {
            const password = generatePassword();
            const hashedPassword = await hashPassword(password);

            studentCredentials.push({
                student_id: student.id,
                username: student.id, // Using student ID as the username
                password: hashedPassword
            });

            console.log(`Generated password for student ${student.id}: ${password}`);
        }

        console.log('Generated student credentials:', studentCredentials);

        if (studentCredentials.length > 0) {
            // Insert student credentials into studentCred collection
            await db.collection('studentCred').insertMany(studentCredentials);
            console.log('Student credentials inserted successfully.');
        } else {
            console.log('No student credentials to insert.');
        }
    } catch (err) {
        console.error('Error generating student credentials:', err);
    } finally {
        // Close the connection
        await client.close();
    }
}

// Call the function to generate student credentials
generateStudentCredentials();
