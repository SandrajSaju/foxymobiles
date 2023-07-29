const express=require("express")
const app=express()
const mongoose=require("mongoose")
const session=require('express-session')
const userRoute=require("./routes/userRoute")
const adminRoute=require('./routes/adminRoute')
require('dotenv').config()
const database=process.env.MONGO_CONNECTION_STRING

app.use("/",userRoute);
app.use("/admin",adminRoute);

app.use(express.urlencoded({extended:false}))
app.use(express.static("public"))


mongoose.connect(database)
.then(()=>{
    app.listen(3000,()=>{
        console.log("Listening on http://localhost:3000");
    })
}).catch((err)=>{
    console.log(err.message);
})
