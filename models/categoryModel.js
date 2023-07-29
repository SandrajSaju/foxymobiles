const mongoose=require("mongoose")

const categorySchema=new mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    offer:{
        type:Number
    }
})

module.exports=mongoose.model("Category",categorySchema)