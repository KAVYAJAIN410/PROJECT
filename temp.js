const { MongoClient } = require('mongodb');

// Connection URI
const uri = 'mongodb+srv://kavyajain1916:K12345678@cluster0.vmxlebi.mongodb.net/newBlog';

// Database Name
const dbName = 'VTOP';

// Sample data to be inserted
const sampleData = [
    { student_id: 1, from_date: '2024-04-29', from_time: '20:00', to_time: '06:00', to_date: '2024-04-30', status: 'Pending' },
    { student_id: 2, from_date: '2024-04-29', from_time: '21:30', to_time: '07:00', to_date: '2024-04-30', status: 'Approved' },
    { student_id: 3, from_date: '2024-04-30', from_time: '22:00', to_time: '08:00', to_date: '2024-05-01', status: 'Pending' },
    { student_id: 4, from_date: '2024-04-30', from_time: '23:00', to_time: '09:00', to_date: '2024-05-01', status: 'Approved' }
];

async function insertData() {
    // Create a new MongoClient
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB server
        await client.connect();

        // Connect to the database
        const db = client.db(dbName);

        // Get the collection
        const collection = db.collection('nightslip');

        // Insert sample data into the collection
        const result = await collection.insertMany(sampleData);
        console.log(`${result.insertedCount} documents inserted successfully.`);
    } catch (error) {
        console.error('Error inserting documents:', error);
    } finally {
        // Close the connection
        await client.close();
    }
}

// Call the function to insert data
insertData();
