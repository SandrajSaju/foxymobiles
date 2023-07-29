const mongoose=require("mongoose")

const bannerSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    bannerImage:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    link:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        required:true
    }
})

module.exports=mongoose.model("Banner",bannerSchema);