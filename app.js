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
const cookieParser= require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const passport= require("passport");
const LocalStrategy= require("passport-local");

const User= require("./models/user.js");
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
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));


const sessionOptions = {
   secret: "mysupersecretstring",
   resave: false,
   saveUninitialized: true,
   cookie:{
    expires:Date.now()+ 3000*60*60*24*3,
    maxAge:3000*60*60*24*3,
    httpOnly:true,//to prevent cross crypting attacks
   },
};


app.use(session(sessionOptions));
app.use(flash()); 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// app.use((req,res,next)=>{//run this middleware for every object
//     res.locals.message= req.flash("success");
//     next();
// })
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    console.log(res.locals.success);
    
    next(); 
});

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

    if(!listing){

        req.flash(
            "error",
            "Listing You requested is not in our Database"
        );

        return res.redirect("/listings");
    }

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
req.flash("success","New Listing Added");
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
req.flash("success","Listing Deleted!");
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
req.flash("success","New Review Added");
res.redirect(`/listings/${listing._id}`);

})

/* ---------------- DELETE REVIEW ROUTE ---------------- */
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;

    await Review.findByIdAndDelete(reviewId);

    await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId }
    });
req.flash("success","Review Deleted");
    res.redirect(`/listings/${id}`);
}));


/* ---------------- SIGNUP ROUTE ---------------- */
app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs")
})

app.post("/signup",async(req,res)=>{
try{
    let {username,password,email}= req.body;
const newUser = new User({email,username});

const registereduser = await User.register(newUser,password);
req.flash("success","Welcome to Stayora!");
res.redirect("/listings");
console.log(registereduser);
}catch(e){
    req.flash("error",e.message);
    res.redirect("/signup");
}


})
app.get("/login",(req,res)=>{
    res.render("users/login.ejs");
})

 app.post(
    "/login",

    passport.authenticate("local", {
        failureRedirect: "/login", // redirect if login fails
        failureFlash: true         // show error flash message
    }),

    async (req, res) => {

        req.flash("success", "Welcome back to Stayora!");

        res.redirect("/listings");
    }
);
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