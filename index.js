const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 3000;
const app = express();

// middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// mongoDB connection
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${user}:${password}@cluster0.q4a9c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Collections
    const usersCollection = client
      .db("bloodBond")
      .collection("user_collection");
    const volunteersCollection = client
      .db("bloodBond")
      .collection("volunteer_collection");
    const donationsRequestCollection = client
      .db("bloodBond")
      .collection("donation_request");

    // !ROUTES
    //TODO: user routes
    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      res.send(user);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // TODO: volunteer routes
    app.get("/volunteers", async (req, res) => {
      const volunteers = await volunteersCollection.find().toArray();
      res.send(volunteers);
    });

    app.post("/volunteers", async (req, res) => {
      const newVolunteer = req.body;
      const result = await volunteersCollection.insertOne(newVolunteer);
      res.send(result);
    });

    // TODO: donation request routes
    app.get("/donation-requests", async (req, res) => {
      const donationRequests = await donationsRequestCollection
        .find()
        .toArray();
      res.send(donationRequests);
    });
    app.post("/donation-requests", async (req, res) => {
      const newDonationRequest = req.body;
      const result = await donationsRequestCollection.insertOne(
        newDonationRequest
      );
      res.send(result);
    });
    app.get("donation-requests", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send("Email is required");
      }
      const query = { email: email };
      const donationRequests = await donationsRequestCollection
        .find(query)
        .toArray();
      res.send(donationRequests);
    });
    app.get("/donation-requests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const donationRequest = await donationsRequestCollection.findOne(query);
      res.send(donationRequest);
    });

    // Update donation request
    app.patch("/donation-requests/:id", async (req, res) => {
      const id = req.params.id;
      const updatedRequest = req.body;

      const query = { _id: new ObjectId(id) };
      const options = { upsert: false };

      const updateDoc = {
        $set: {
          name: updatedRequest.name,
          recipient_name: updatedRequest.recipient_name,
          hospital_name: updatedRequest.hospital_name,
          phone: updatedRequest.phone,
          bloodGroup: updatedRequest.bloodGroup,
          district: updatedRequest.district,
          donation_date: updatedRequest.donation_date,
          donation_time: updatedRequest.donation_time,
          full_address: updatedRequest.full_address,
          request_message: updatedRequest.request_message,
        },
      };

      try {
        const result = await donationsRequestCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      } catch (error) {
        console.error("Failed to update donation request:", error);
        res.status(500).send({ error: "Update failed" });
      }
    });

    // Delete donation request
    app.delete("/donation-requests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationsRequestCollection.deleteOne(query);
      res.send(result);
    });
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Donate blood, save lives!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`http://localhost:${port}`);
});
