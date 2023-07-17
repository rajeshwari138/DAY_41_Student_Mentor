require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoDB = require("mongodb");

const mongoClient = mongoDB.MongoClient;
const objId = mongoDB.ObjectID;
const dbUrl = process.env.DB_URL ;

const app = express();
app.use(cors());
app.use(bodyParser.json());
// let students = [
//   {
//     id: 1,
//     name: "Prashant Gupta",
//   },
//   {
//     id: 2,
//     name: "Arpan Gupta",
//     mentorId : 3
//   },
//   {
//     id: 3,
//     name: "Darpan Gupta",
//     mentorId : 3
//   },
// ];
// let mentors = [
//   {
//     id: 1,
//     name: "RV",
//   },
//   {
//     id: 2,
//     name: "Venkat",
//   },
//   {
//     id: 3,
//     name: "Arun",
//     students: [3, 2]
//   },
// ];

app.get("/", function (req, res) {
  res.json("Server is up and running. Please proceed to defined endpoints");
});

app.get("/students/:mentorId", async function (req, res) {
  if (req.params.mentorId) {
    try {
      let client = await mongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
      let db = client.db("studentmentor");
      let data = await db.collection("students").find({ mentorId: objId(req.params.mentorId) }).toArray();
      if(data) res.json(data);
      else res.json([])
    } catch (err) {
      console.log(err);
    }
  } else {
    let data2 = await db.collection("students").find().toArray();
    res.json(data2);
  }
});

app.get("/unassignedstudents", async function (req, res) {
  try {
    let client = await mongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
    let db = client.db("studentmentor");
    let unassignedstudents = await db.collection("students").find( { $or: [{ mentorId : { $exists : false } }, { mentorId : { $eq : '' } } ] } ).toArray();
    res.json(unassignedstudents);
    }  catch (err) {
      console.log(err);
    }
     
  });

app.post("/addStudent", async function (req, res) {
  try {
    let client = await mongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
    let db = client.db("studentmentor");
    let result = await db.collection("students").insertOne({name: req.body.name});
    let result2 = await db.collection("students").find().toArray();
    res.json(result2);
  }  catch (err) {
    console.log(err);
  }
});

app.post("/assignMentor", async function (req, res) {
  let mentor = req.body.mentor;
  let inpstudents = req.body.students;
 
  try {
    let client = await mongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
    let db = client.db("studentmentor");
    let result = await db.collection("students").updateOne({ _id : { $eq : objId(inpstudents) } },  { $set: { mentorId : objId(mentor) } } );
    let result2 = await db.collection("mentors").updateOne({ _id : { $eq : objId(mentor) } },  { $push: { students: objId(inpstudents) }} );
    let unassignedstudents = await db.collection("students").find( { $or: [{ mentorId : { $exists : false } }, { mentorId : { $eq : '' } } ] } ).toArray();
    res.json(unassignedstudents);

  }  catch (err) {
    console.log(err);
  }
});

app.post("/changeMentor", async function (req, res) {
    let mentorId = req.body.mentorId;
    let studentId = req.body.studentId;

    try {
      let client = await mongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
      let db = client.db("studentmentor");
      let studentRec = await db.collection("students").findOne( { _id : { $eq : objId(studentId) } });
      let updateStuRec = await db.collection("students").updateOne({ _id : { $eq : objId(studentId) } },  { $set: { mentorId : objId(mentorId) } } );
      let remStuIdOldMentor = await db.collection("mentors").updateOne({ _id : { $eq : objId(studentRec.mentorId) } },  { $pull: { students: objId(studentId) }} );
      let result2 = await db.collection("mentors").updateOne({ _id : { $eq : objId(mentorId) } },  { $push: { students: objId(studentId) }} );
      let data = await db.collection("students").find({ mentorId: objId(studentRec.mentorId) }).toArray();
      res.json(data);
  
    }  catch (err) {
      console.log(err);
    }
  });

app.get("/mentors", async function (req, res) {
 
  try {
    let client = await mongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
    let db = client.db("studentmentor");
    let data = await db.collection("mentors").find().toArray();
    res.json(data);
  } catch (err) {
    console.log(err);
  }
});

app.post("/addMentor", async function (req, res) {

  try {
    let client = await mongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
    let db = client.db("studentmentor");
    let result = await db.collection("mentors").insertOne({name: req.body.name});
    let result2 = await db.collection("mentors").find().toArray();
    res.json(result2);
  }  catch (err) {
    console.log(err);
  }
});

app.get("/unassignedmentors/:studentId", async function (req, res) {
    
  try {
    let studentId = req.params.studentId;
    let client = await mongoClient.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true});
    let db = client.db("studentmentor");
    let result = await db.collection("students").find({_id : objId(studentId)}).toArray();
    let result2 = await db.collection("mentors").find({ _id: { $ne: objId(result.mentorId) } }).toArray();
    const filteredMentors = result2.filter(mentor => mentor._id != result.mentorId);
    res.json({
          mentors: filteredMentors,
          student: result
      });
  }  catch (err) {
    console.log(err);
  }
  });

app.listen(3000);
