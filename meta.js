const mongoose = require('mongoose');
const axios = require('axios');
const faker = require('faker');

// Connect to MongoDB
mongoose.connect('mongodb+srv://kavyajain1916:K12345678@cluster0.vmxlebi.mongodb.net/VTOP');

// Define schema for student admission data
const studAdmSchema = new mongoose.Schema({
  // Define schema fields based on your actual data structure
  // Assuming you have an 'id' field and a 'branch' field
  id: String,
  branch: String,
  // Add other fields as needed
});

const StudAdm = mongoose.model('StudentAdm', studAdmSchema);

// Define schema for student meta details
const studMetaSchema = new mongoose.Schema({
  studentId: String, // Assuming 'id' field from studentAdm
  name: String,
  parentsName: String,
  dateOfBirth: Date,
});

const StudMeta = mongoose.model('StudMeta', studMetaSchema);

// Function to generate meta details for a student
async function generateMetaDetails(student) {
  const name = faker.name.findName();
  const parentsName = faker.name.findName();
  const dateOfBirth = faker.date.past();
  return { studentId: student.id, name, parentsName, dateOfBirth };
}

// Function to create student meta details for all students
async function createStudentMetaDetails() {
  const students = await StudAdm.find(); // Retrieve all students from the admission collection
  const metaDetailsPromises = students.map(async (student) => {
    const metaDetails = await generateMetaDetails(student);
    return StudMeta.create(metaDetails); // Create and save meta details for the student
  });
  await Promise.all(metaDetailsPromises); // Wait for all meta details to be created and saved
}

// Create student meta details
createStudentMetaDetails()
  .then(() => {
    console.log('Student meta details created successfully');
    mongoose.disconnect(); // Disconnect from MongoDB
  })
  .catch((error) => {
    console.error('Error creating student meta details:', error);
    mongoose.disconnect(); // Disconnect from MongoDB in case of error
  });
