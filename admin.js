const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// MongoDB connection URI
const mongoUri = 'mongodb+srv://kavyajain1916:K12345678@cluster0.vmxlebi.mongodb.net/VTOP';
const dbName = 'VTOP'; // Replace 'your_database_name' with your actual database name
const collectionName = 'Admin';

// Sample admin data
const adminData = [
    { 
        name: 'john', 
        yearOfJoining: 2020, 
        phoneNumber: '1234567890', 
        email: 'john43@example.com', 
        username: 'John234', 
        password: 'johnBanegaDon' 
    },
    { 
        name: 'vikas mishra', 
        yearOfJoining: 2021, 
        phoneNumber: '9876543210', 
        email: 'vikasMishra23@example.com', 
        username: 'Vikas123', 
        password: 'ModiKaregaVikas' 
    },
    // Add more admin data as needed
];

// Function to hash the password
async function hashPassword(password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password with 10 rounds of salt
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
}

// Connect to MongoDB and insert admin data
async function insertAdminData() {
    try {
        // Connect to MongoDB
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db(dbName);

        // Insert admin data into the collection
        await Promise.all(adminData.map(async (admin) => {
            const hashedPassword = await hashPassword(admin.password);
            // Store both hashed and actual password in the database
            await db.collection(collectionName).insertOne({ 
                ...admin, 
                hashedPassword, // Store the hashed password
                actualPassword: admin.password // Store the actual password
            });
        }));

        // Close the MongoDB connection
        await client.close();

        console.log("Admin data inserted into the database.");
    } catch (error) {
        console.error(error);
    }
}

// Insert admin data into the database
insertAdminData();
