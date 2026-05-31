const mongoose = require("mongoose");

const data = require("./data.js");

const Listing = require("../models/listing.js");

main()
    .then(() => {
        console.log("✅ MongoDB Connected");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(
        "mongodb://2305584_db_user:8BXFXRj0jCiSQKrv@ac-bbbxw9y-shard-00-00.t0k5ami.mongodb.net:27017,ac-bbbxw9y-shard-00-01.t0k5ami.mongodb.net:27017,ac-bbbxw9y-shard-00-02.t0k5ami.mongodb.net:27017/?ssl=true&replicaSet=atlas-s3mezj-shard-0&authSource=admin&appName=Cluster0"
    );

    await initdb();
}

const initdb = async () => {
    await Listing.deleteMany({});

    await Listing.insertMany(data.data);

    console.log("✅ Data was initialized");
};