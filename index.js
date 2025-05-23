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

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client
      .db("bloodBond")
      .collection("user_collection");
    const volunteersCollection = client
      .db("bloodBond")
      .collection("volunteer_collection");
    const donationsRequestCollection = client
      .db("bloodBond")
      .collection("donation_request");
    const donationsCollection = client
      .db("bloodBond")
      .collection("donation_collection");
    // User routes
    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      res.send(user);
    });

    app.get("/users-by-email/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      res.send(user);
    });

    app.patch("/users-by-email/:email", async (req, res) => {
      const email = req.params.email;
      const updatedUser = req.body;

      const result = await usersCollection.updateOne(
        { email: email },
        { $set: updatedUser }
      );

      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );

      res.send(result);
    });

    // Volunteer routes
    app.get("/volunteers", async (req, res) => {
      const volunteers = await volunteersCollection.find().toArray();
      res.send(volunteers);
    });

    app.post("/volunteers", async (req, res) => {
      const newVolunteer = req.body;
      const result = await volunteersCollection.insertOne(newVolunteer);
      res.send(result);
    });

    app.get("/volunteers/:email", async (req, res) => {
      const email = req.params.email;
      const volunteer = await volunteersCollection.findOne({ email });
      res.send(volunteer);
    });

    app.patch("/volunteers/:email", async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;

      try {
        const filter = { email: email };
        const updateDoc = {
          $set: {
            name: updatedData.name,
            age: updatedData.age,
            bloodGroup: updatedData.bloodGroup,
            profession: updatedData.profession,
            contact: updatedData.contact,
            address: updatedData.address,
            gender: updatedData.gender,
            photo: updatedData.photo,
          },
        };

        const result = await volunteersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error updating volunteer:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.get("/volunteers-donations", async (req, res) => {
      const volunteerEmail = req.query.volunteerEmail;
      const query = volunteerEmail ? { volunteer_email: volunteerEmail } : {};
      const donations = await donationsCollection.find(query).toArray();
      res.send(donations);
    });

    app.post("/volunteers-donations", async (req, res) => {
      const newDonation = req.body;
      if (!newDonation || typeof newDonation !== "object") {
        return res.status(400).send({ error: "Invalid donation data" });
      }

      try {
        const result = await donationsCollection.insertOne(newDonation);
        res.send(result);
      } catch (error) {
        console.error("Insert failed:", error);
        res.status(500).send({ error: "Insert failed" });
      }
    });

    app.get("/donation-requests", async (req, res) => {
      try {
        const email = req.query.email;
        const limit = parseInt(req.query.limit);
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const sortOrder = req.query.sortOrder === "newest" ? -1 : 1;
        const bloodGroup = req.query.bloodGroup;

        const filter = {};
        if (email) filter.email = email;

        if (bloodGroup) {
          filter.bloodGroup = { $regex: `^${bloodGroup}$`, $options: "i" };
        }

        const skip = (page - 1) * size;
        const count = await donationsRequestCollection.countDocuments(filter);

        let query = donationsRequestCollection.find(filter);

        if (limit > 0) {
          query = query.limit(limit);
        } else {
          query = query.skip(skip).limit(size);
        }

        const donationRequests = await query
          .sort({ createdAt: sortOrder }) // You must have a createdAt field
          .toArray();

        res.send({
          data: donationRequests,
          count,
        });
      } catch (error) {
        console.error("Error fetching donation requests:", error);
        res.status(500).send({ error: "Failed to fetch donation requests" });
      }
    });

    app.post("/donation-requests", async (req, res) => {
      const newDonationRequest = req.body;
      const result = await donationsRequestCollection.insertOne(
        newDonationRequest
      );
      res.send(result);
    });

    app.get("/donation-requests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const donationRequest = await donationsRequestCollection.findOne(query);
      res.send(donationRequest);
    });

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

    app.delete("/donation-requests/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationsRequestCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Do not close client here for persistent connection
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
