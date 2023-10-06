import express from "express"
import bodyParser from "body-parser"
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;
const connectionString = process.env.CONECTION_STRING;
let todayWork=[];
let works=[];
const d = new Date();

const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const day = d.toLocaleString('en-IN', options);
  const uri = connectionString;
const client = new MongoClient(uri);
async function insertTask(collectionName, task) {
    try {
      await client.connect();
      const database = client.db("mostan");
      const collection = database.collection(collectionName);
      const doc = {
        task: task,
        date: new Date(),
      };
      const data = await collection.insertOne(doc);
      return data;
    } finally {
      // Ensure that the client connection is closed
      await client.close();
    }
  }

  async function getTasks(collectionName) {
    try {
      await client.connect();
      const database = client.db("mostan");
      const collection = database.collection(collectionName);
      const tasks = await collection.find({}).toArray();
      return tasks;
    } finally {
      await client.close();
    }
  }
  
  async function deleteTasks(collectionName, id) {
    try {
        // console.log(id);
      await client.connect();
      const database = client.db("mostan");
      const collection = database.collection(collectionName);
      const query = new ObjectId(id);
    //   console.log(await collection.findOne({_id: query}));
      const tasks = await collection.deleteOne({_id: query});
      return tasks;
    } finally {
      await client.close();
    }
  }

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended:true}));

app.get("/", async (req, res)=>{
    try {
        const todayList = await getTasks("todayList");
        res.render("index.ejs", { todayWork: todayList, day: day });
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send("Internal Server Error");
      }
})
app.get("/works", async (req, res)=>{
    try {
        const workList = await getTasks("workList");
        res.render("works.ejs",{works:workList});
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send("Internal Server Error");
      }
})

app.post("/submit", async (req, res) => {
    try {
      if (req.body.todayWork) {
        const data = await insertTask("todayList", req.body.todayWork);
        console.log(data);
        console.log(`Inserted document into todayList with id: ${data.insertedId}`);
      res.redirect("/");
      } else {
        const data = await insertTask("workList", req.body.works);
        console.log(`Inserted document into workList with id: ${data.insertedId}`);
      res.redirect("/works");
      }
    } catch (error) {
      console.error("Error inserting task:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/delete",async (req, res)=>{
    try {
        console.log(req.body);
        if(req.body.todayId){
            const data = await deleteTasks("todayList", req.body.todayId)
            console.log(data);
            res.redirect('/');
        }else{
            const data = await deleteTasks("workList", req.body.workId)
            console.log(data);
            res.redirect('/works');

        }

    } catch (error) {
        console.error("Error deleting task:", error);
      res.status(500).send("Internal Server Error");

    }
  })

app.listen(port, ()=>{
    console.log(`Listening on port: ${port}`);
})