const mongoose=require('mongoose');

const productSchema=new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    color:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    images:{
        type:[String]
    },
    totalStock:{
        type:Number,
        required:true
    },
    offerPrice:{
        type:Number
    },
    isAvailable:{
        type:Boolean,
        required:true
    }
})

module.exports=mongoose.model("Product",productSchema)