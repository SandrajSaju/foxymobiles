const mongoose = require('mongoose');

const offerSchema=new mongoose.Schema({
    offerTitle:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
    },
    offerDiscount:{
        type:Number,
        required:true,
    },
    startDate:{
        type:Date,
        required:true,
    },
    endDate:{
        type:Date,
        required:true,
    },
    isAvailable:{
        type:Boolean,
        default:true
    }
});

module.exports=mongoose.model('Offer',offerSchema)