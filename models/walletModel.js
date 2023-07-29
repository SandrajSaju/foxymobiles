const mongoose=require("mongoose");

const walletSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    balance:{
        type:Number,
        default:0
    },
    credits:[{
        order:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Order'
        },
        date:{
            type:Date
        },
        productName:{
            type:String
        },
        quantity:{
            type:Number
        },
        amount:{
            type:Number
        }
    }],
    debits:[{
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        date: {
            type: Date,
        },
        amount: {
            type: Number,
        }
    }]
})

module.exports=mongoose.model("Wallet",walletSchema)