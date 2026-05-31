const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
const Listing = require("./models/listing.js");
const path = require("path");

const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const wrapAsync= require("./utils/wrapAsync.js");   
const ExpressError= require("./utils/ExpressError.js");
const {listingschema}= require("./schema.js");
const Review = require("./models/review.js");
const {reviewschema} = require("./schema.js");


dns.setDefaultResultOrder("ipv4first");

const app = express();

/* ---------------- MONGODB CONNECTION ---------------- */

mongoose.connect(
"mongodb://2305584_db_user:8BXFXRj0jCiSQKrv@ac-bbbxw9y-shard-00-00.t0k5ami.mongodb.net:27017,ac-bbbxw9y-shard-00-01.t0k5ami.mongodb.net:27017,ac-bbbxw9y-shard-00-02.t0k5ami.mongodb.net:27017/?ssl=true&replicaSet=atlas-s3mezj-shard-0&authSource=admin&appName=Cluster0"
)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log("❌ MongoDB Error");
    console.log(err);
});

/* ---------------- APP CONFIG ---------------- */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

/* ---------------- HOME ---------------- */

app.get("/", (req, res) => {
    res.redirect("/listings");
});
const validatelisting =(req,res,next) =>{
    let {err} = listingschema.validate(req.body);
    if(err){
        throw new ExpressError(400,err);
    }else{
        next(); 
    }
}
const reviewlisting= (req,res,next) =>{
    let {err} = reviewschema.validate(req.body);
    if(err){
        throw new ExpressError(404,err);
    }else{
        next();
    }
}
/* ---------------- INDEX ROUTE ---------------- */

app.get("/listings", async (req, res) => {

    const alllistings = await Listing.find({});

    res.render("listings/index.ejs", {
        alllistings
    });

});

/* ---------------- NEW ROUTE ---------------- */

app.get("/listings/new", (req, res) => {

    res.render("listings/new.ejs");

});

/* ---------------- SHOW ROUTE ---------------- */

app.get("/listings/:id", wrapAsync(async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id).populate("reviews");

    res.render("listings/show.ejs", {
        listing
    });

}));

/* ---------------- CREATE ROUTE ---------------- */

app.post("/listings",validatelisting,wrapAsync(async (req, res) => {

    if (
        !req.body.listing.image ||
        !req.body.listing.image.url ||
        req.body.listing.image.url.trim() === ""
    ) {

        req.body.listing.image = {
            filename: "listingimage",
            url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBrmmhVb59P-PoQSerXoRGIPnwBwkiZ8infg&s"
        };

    }
   ;
    const newListing = new Listing(req.body.listing);

    await newListing.save();

    res.redirect("/listings");

}));

/* ---------------- EDIT ROUTE ---------------- */

app.get("/listings/:id/edit",wrapAsync( async (req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id);

    res.render("listings/edit.ejs", {
        listing
    });

}));

/* ---------------- UPDATE ROUTE ---------------- */

app.put("/listings/:id",validatelisting,wrapAsync( async (req, res) => {

    let { id } = req.params;

    if (
        !req.body.listing.image ||
        !req.body.listing.image.url ||
        req.body.listing.image.url.trim() === ""
    ) {

        req.body.listing.image = {
            filename: "listingimage",
            url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBrmmhVb59P-PoQSerXoRGIPnwBwkiZ8infg&s"
        };

    }

    await Listing.findByIdAndUpdate(
        id,
        req.body.listing,
        {
            
        runValidators: true,
        returnDocument: "after"
        }
    );

    res.redirect(`/listings/${id}`);

}));

/* ---------------- DELETE ROUTE ---------------- */

app.delete("/listings/:id", wrapAsync(async (req, res) => {

    let { id } = req.params;

    await Listing.findByIdAndDelete(id);

    res.redirect("/listings");

}));
//review
//post


/* ---------------- REVIEW ROUTE ---------------- */
app.post("/listings/:id/reviews",reviewlisting,async(req,res)=>{
let listing = await Listing.findById(req.params.id);
let newreview = new Review(req.body.review);//Create a Review object
listing.reviews.push(newreview);
 await newreview.save();
    await listing.save();
console.log(req.body.review);
res.redirect(`/listings/${listing._id}`);

})

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));//it creates an error object   then it passes into error handler
});
app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong" } = err;
res.render("error.ejs",{err});
   //res.status(status).send(message);//this is an error middleware 
});

/* ---------------- SERVER ---------------- */

app.listen(8080, () => {

    console.log("🚀 Server Running on Port 8080");

});