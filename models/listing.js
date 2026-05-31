const { ref } = require("joi");
const mongoose = require("mongoose");

const listingschema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
    },

  
    image: {
    filename: {
        type: String,
        default: "listingimage",
    },

    url: {
        type: String,
        default:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBrmmhVb59P-PoQSerXoRGIPnwBwkiZ8infg&s",
    },
},

    price: {
        type: Number,
    },

    location: {
        type: String,
    },

    country: {
        type: String,
    },
    reviews:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Review",
        },
    ],
});

const Listing = mongoose.model("Listing", listingschema);

module.exports = Listing;