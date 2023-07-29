const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({

    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String
    },
    isBlocked:{
        type:Boolean
    }
})



module.exports=mongoose.model("User",userSchema);