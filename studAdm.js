const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb+srv://kavyajain1916:K12345678@cluster0.vmxlebi.mongodb.net/VTOP';
const dbName = 'VTOP';
const collectionName = 'studentAdm';

// Function to generate a unique student ID
async function generateUniqueID(db, admissionYear, branchShortForm) {
    let id;
    do {
        // Count the number of students in the current branch
        const count = await db.collection(collectionName).countDocuments({ branchShortForm });
        
        // Generate sequence of numbers (last 4 digits)
        const sequence = (count + 1).toString().padStart(4, '0');

        // Combine admission year, branch short form, and sequence to form ID
        id = admissionYear.toString().slice(-2) + branchShortForm + sequence;
    } while (await db.collection(collectionName).findOne({ id }));
    return id;
}

// Function to generate branch short form
function generateBranchShortForm(branch) {
    const initialLetter = branch[0].toUpperCase();
    const remainingLetters = branch.substring(1, 4).toUpperCase().padEnd(2, 'X');
    return initialLetter + remainingLetters;
}

// Function to add student admission data to the database
async function addStudentAdmissionData() {
    try {
        // Connect to MongoDB
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db(dbName);

        // Sample data of student admission
        const studentsAdmission = [
            { name: "John Doe", branch: "Computer Science", admissionYear: 2022 },
            { name: "Emma Smith", branch: "Electrical Engineering", admissionYear: 2022 },
            { name: "David Johnson", branch: "Mechanical Engineering", admissionYear: 2023 },
            // Add more student admission data as needed
        ];

        // Map each student admission data to generate student IDs and insert into the collection
        await Promise.all(studentsAdmission.map(async (student) => {
            // Generate branch short form
            const branchShortForm = generateBranchShortForm(student.branch);
            // Generate unique student ID
            const id = await generateUniqueID(db, student.admissionYear, branchShortForm);
            // Insert the student admission data into the collection
            await db.collection(collectionName).insertOne({ ...student, id, branchShortForm });
        }));

        // Close the MongoDB connection
        await client.close();

        console.log("Student admission data added to the database.");
    } catch (error) {
        console.error(error);
    }
}

// Add student admission data to the database
addStudentAdmissionData();
