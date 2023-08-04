const mongoose=require('mongoose');
const User=require('../models/userModel');
const axios = require('axios')
const Product=require("../models/productModel");
const Category=require("../models/categoryModel");
const Cart=require("../models/cartModel")
const Order=require("../models/orderModel")
const Banner=require("../models/bannerModel")
const Coupon=require("../models/couponModel")
const Wallet=require("../models/walletModel")
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const Razorpay = require("razorpay")
var moment = require("moment-timezone")


const getSignupPage=(req,res)=>{
    res.set("Cache-Control", "no-store")
    console.log("hi");
    res.render('userSignup')
}

const getLoginPage=(req,res)=>{
    res.set("Cache-Control", "no-store")
    res.render('userLogin')
}

const getGuestHome=async (req,res)=>{
    res.set("Cache-Control", "no-store")
    const banners=await Banner.find({isActive:true}).populate("category")
    const products=await Product.find({isAvailable:true})
    const productsPerPage = 8;
    var totalPages = Math.ceil(products.length / productsPerPage);
    var currentPage = req.query.page ? parseInt(req.query.page) : 1; 
	currentPage=currentPage<1?1:currentPage 
    currentPage=currentPage>totalPages?totalPages:currentPage
    // const currentPage = req.query.page ? parseInt(req.query.page) : 1;
    res.render('guestHome',{products,banners,currentPage,totalPages,productsPerPage})
}

const getOtpVerificationPage=(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const phoneNumber = req.params.phoneNumber
        res.render('otpVerification',{phoneNumber})
    }catch(err){
        console.log(err.message);
    }
}

const insertUser=async(req,res)=>{
    try{
        const phoneNumber=req.body.phoneNumber
        const existingUser=await User.findOne({phoneNumber:req.body.phoneNumber})
    if(existingUser){
        res.render("userSignup",{message:"Phone Number already Registered"})
    }else{
        req.session.user={
            fullName:req.body.fullName,
            email:req.body.email,
            phoneNumber:req.body.phoneNumber,
            password:req.body.password,
            role:"user",
            isBlocked:false
        }
        if(req.body.password!==req.body.confirmPassword){
            return res.render('userSignUp',{message:"Please enter Correct Password"})
        }
        async function generateOtp() {
            console.log('generateOtp')
            let otp = Math.floor(100000 + Math.random() * 900000)
            console.log(otp + " " + req.body.phoneNumber);
            req.session.phone = req.body.phoneNumber
            req.session.otp = otp;
            await sendOtp(otp, req.body.phoneNumber)
          }
          generateOtp();
          res.render('otpVerification',{phoneNumber});
    }
    }catch(err){
        console.log(err.message);
        res.redirect('/userSignup')
    }
}

function sendOtp(otp, number) {
    try{
        console.log('sendotp')
    console.log(otp)
    const body = {
      "authorization": process.env.FAST_2_SMS,
      "variables_values": otp,
      "route": "otp",
      "numbers": number
    }
    return axios({
      method: 'GET',
      url: 'https://www.fast2sms.com/dev/bulkV2',
      data: body
    })
    }catch(err){
        console.log(err.message);
    }
  }


const resendOtp=async(req,res)=>{
    try {
        const phoneNumber = req.params.phoneNumber
        const generateOTP = async () => {
            let otp = Math.floor(100000 + Math.random() * 900000)
            console.log("Resend:"+ otp)
            req.session.otp = otp
            await sendOtp(otp, phoneNumber)
            res.redirect("/otpVerify/${phoneNumber}")
        }
        generateOTP()
    } catch (error) {
        console.log(error.message)
    }
}

const verifyOtp=async(req,res)=>{
    res.set("Cache-Control", "no-store")
    const phoneNumber=req.params.phoneNumber
    console.log(req.body.otp)
    const otp=req.session.otp
    console.log(otp);
    if(req.body.otp==otp){
        try{
            const myUser=new User(req.session.user)
            await myUser.save()
            res.redirect('/userLogin')
        }catch(err){
            console.log(err.message);
            res.redirect('/userSignup')
        }
    }else{
        res.render('otpVerification',{message:"Invalid OTP",phoneNumber})
    }
}

const verifyLogin=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const phoneNumber=req.body.phoneNumber
        const password=req.body.password

        const userData=await User.findOne({phoneNumber:phoneNumber})
        if(userData && userData.role==="user" && userData.isBlocked===false){
            if(userData.password!==password){
                res.render('userLogin',{message:"Incorrect Password"})
            }else{

                let cart=await Cart.findOne({user:userData._id})
                let wallet=await Wallet.findOne({user:userData._id})
                let cartId
                if(!cart || !wallet){
                    if(!cart){
                        const newCart=new Cart({
                            user:userData._id,
                            products:[],
                            totalAmount:0
                        })
                        await newCart.save()
                       
                    }
                    if(!wallet){
                        const newWallet=new Wallet({
                        user:userData._id,
                        balance:0
                        })
                        await newWallet.save()
                        
                    }
                    req.session.user_id=userData._id
                    res.redirect("/userHome")
                }else{
                    req.session.user_id=userData._id
                    res.redirect("/userHome")  
                }  
            }
        }else if(userData && userData.role==="user" && userData.isBlocked===true){
            res.render("userLogin",{message:"User is Blocked"})
        }else{
            res.render("userLogin",{message:"User Didnt Exist"})
        }

    }catch(err){
        console.log(err.message)
    }
}

const getUserHome =async (req,res)=>{
    res.set("Cache-Control", "no-store")
    const user=await User.findOne({_id:req.session.user_id})
    const products=await Product.find({isAvailable:true})
    const banners=await Banner.find({isActive:true}).populate("category")
    const categories=await Category.find({isDeleted:false})

    const cart=await Cart.findOne({user:user._id})
    res.render("userHome",{user:user, products,cart,banners,categories,req})
}

const userLogout=(req,res)=>{
    try{
        req.session.user_id=null
        res.redirect("/")
    }catch(err){
        console.log(err.message);
    }
}





const getForgetPasswordPage=async (req,res)=>{
    res.set("Cache-Control", "no-store")
    res.render('forget')
}

const verifyForgetphoneNumber=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const phoneNumber=req.body.phoneNumber
        const userData=await User.findOne({phoneNumber})
        if(userData){
            async function generateOtp() {
                console.log('generateOtp')
                let otp = Math.floor(100000 + Math.random() * 900000)
                console.log(otp + " " + req.body.phoneNumber);
                req.session.phone = req.body.phoneNumber
                req.session.otp = otp;
                await sendOtp(otp, req.body.phoneNumber)
              }
              generateOtp();
              res.render('forgetOtpVerification',{phoneNumber:req.body.phoneNumber});
        }else{
            res.render('forget',{message:"Phone Number is Incorrect"})
        }
    }catch(err){
        console.log(err.message);
    }
}

const getResetPasswordPage=async (req,res)=>{
    try{
        const phoneNumber=req.params.phoneNumber
        res.set("Cache-Control", "no-store")
        res.render("resetPassword", { phoneNumber: phoneNumber })
    }catch(err){
        console.log(err.message);
    }
}

const verifyForgetOtp=async (req,res)=>{
    const otp=req.session.otp
    const phoneNumber=req.params.phoneNumber
    console.log(otp);
    if(req.body.otp==otp){
         res.redirect(`/resetPassword/${phoneNumber}`)
    }else{
        res.render('forgetOtpVerification',{message:"Invalid OTP"})
    }
}

const resetPassword=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const phoneNumber=req.params.phoneNumber
        const newPassword=req.body.newPassword
        const confirmNewPassword = req.body.confirmNewPassword
        
        const userData= await User.findOne({phoneNumber})
        if (userData && newPassword === confirmNewPassword) {
            userData.password = newPassword
            await userData.save()
            res.redirect("/userLogin")
        } else {
            res.render("resetPassword", { message: "Passwords didnt Match", phoneNumber: phoneNumber })
        }
    }catch(err){
        console.log(err.message);
    }
}

const getUserProfilePage=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId=req.params.user_id
        const user=await User.findById(userId);
        const cart=await Cart.findOne({user:userId})
        res.render('userProfile',{user,cart})
    }catch(err){
        console.log(err.message);
    }
}

const getUserEditPage=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId=req.params.user_id
        const user=await User.findById(userId);
        const cart=await Cart.findOne({user:userId})
        res.render('userProfileEdit',{user,cart})
    }catch(err){
        console.log(err.message);
    }
}

const updateUserProfile=async (req,res)=>{
    try {
        res.set("Cache-Control", "no-store")
        const userId = req.params.user_id
        const userData = await User.findByIdAndUpdate(userId, { $set: { fullName: req.body.name, email: req.body.email} })
        if (userData) {
            res.redirect(`/userProfile/${userId}`)
        }
    } catch (error) {
        console.log(error.message)
    }
}


const applyCoupon = async (req, res) => {
    try {
        const couponCode = req.body.coupon
        let coupon = await Coupon.findOne({ code: couponCode })
        const userId = req.session.user_id
        let cart = await Cart.findOne({ user: userId }).populate("products.product")
        const user = await User.findById(userId)
        const order = await Order.findOne({ cart: cart._id })
        const coupons = await Coupon.find()

        const currentDate = new Date()
        if (currentDate < coupon.validityStart || currentDate > coupon.validityEnd) {
            coupon.is_active = false
            await coupon.save()
            return res.json({ success: false, message: "The Coupon is Expired" })
        }

        if (coupon.totalUsageCount >= coupon.usageLimit) {
            coupon.is_active = false
            await coupon.save()
            return res.json({ success: false, message: "The Coupon usage limit has reached" })
        }

        let totalAmount = cart.totalAmount

        if (coupon.is_active) {
            if (coupon.discountType === "Percentage") {
                if (totalAmount >= coupon.minimumOrderAmount) {
                    const discountablePrice = totalAmount * (coupon.discountValue / 100)
                    if (discountablePrice <= coupon.maximumDiscountAmount) {
                        totalAmount = totalAmount - discountablePrice

                        const userDetails = {
                            user: userId
                        }
                        coupon.usedBy.push(userDetails)
                        coupon.totalUsageCount += 1

                        cart.totalAmount = totalAmount

                        await cart.save()
                        await coupon.save()

                        res.json({
                            success: true,
                            message: "Coupon Applied Successfully",
                            cart: cart,
                            order: order,
                            coupons: coupons
                        })

                    } else {
                        totalAmount = totalAmount - coupon.maximumDiscountAmount

                        const userDetails = {
                            user: userId
                        }
                        coupon.usedBy.push(userDetails)
                        coupon.totalUsageCount += 1

                        cart.totalAmount = totalAmount

                        await cart.save()
                        await coupon.save()

                        res.json({
                            success: true,
                            message: "Coupon Applied Successfully",
                            cart: cart,
                            order: order,
                            coupons: coupons
                        })

                    }

                } else {
                    res.json({ success: false, message: `The Minimum Order Amount for Applying this Coupon is ₹${coupon.minimumOrderAmount}` })
                }
            } else {
                if (totalAmount >= coupon.minimumOrderAmount) {
                    const discountablePrice = coupon.discountValue
                    totalAmount = totalAmount - discountablePrice

                    const userDetails = {
                        user: userId
                    }
                    coupon.usedBy.push(userDetails)
                    coupon.totalUsageCount += 1

                    cart.totalAmount = totalAmount

                    await cart.save()
                    await coupon.save()
                    res.json({
                        success: true,
                        message: "Coupon Applied Successfully",
                        cart: cart,
                        order: order,
                        coupons: coupons
                    })

                } else {
                    res.json({ success: false, message: `The Minimum Order Amount for Applying this Coupon is ₹${coupon.minimumOrderAmount}` })
                }
            }
        } else {
            res.json({ success: false, message: "Coupon is inactive" })
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ success: false, message: "Error applying coupon" })
    }
}


const getSuccessPage=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store")
        const userId=req.params.user_id
        const user=await User.findById(userId)
        console.log(user);
        res.render('orderSuccess',{user})
    }catch(err){
        console.log(err.message);
    }
}


const getWalletPage=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store")
        const userId=req.params.user_id;
        const user=await User.findById(userId)
        const cart = await Cart.findOne({ user: userId }).populate("user")
        
        let wallet=await Wallet.findOne({user:userId});

        if(!wallet){
            wallet=new Wallet({
                user:userId
            })
        }

        wallet.save()
        res.render('wallet',{wallet,user,cart})

    }catch(err){
        console.log(err.message);
    }
}


const searchProducts=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
    const userId = req.session.user_id
    const user = await User.findById(userId)
    const productData = await Product.find().populate("category")
    const cart = await Cart.findOne({ user: userId }).populate("products.product")
    const search = req.query.search
    console.log(search);
    if (search !== "") {
        const flteredProducts = productData.filter((product) => {
            return product.productName.toLowerCase().startsWith(search.toLowerCase())
        })
        res.render("shopBySearch", { user, products: flteredProducts,cart})
    }
    } catch (error) {
    console.log(error.message)
    }
}

const getShopByCategoryPage=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId = req.session.user_id
        const categoryId = req.params.category_id
        const category = await Category.findById(categoryId)
        const user = await User.findById(userId)
        const products = await Product.find({category:categoryId}).populate("category")
        
        res.render("shopByCategory", { user, products,category})
        
    }catch(err){
        console.log(err.message);
    }
}

const downloadInvoice=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const cartId = req.params.cart_id;
        const purchasedDate = new Date(req.params.purchased_date);
        const cart = await Cart.findById(cartId);
        const userId = cart.user;
        const user = await User.findById(userId);
    const order = await Order.findOne({ cart: cartId }).populate('purchasedProducts.product');
    let products = [];

    for (const orderItem of order.purchasedProducts) {
      if (
        orderItem.date.toISOString() === purchasedDate.toISOString() &&
        orderItem.userName === user.fullName
      ) {
        // const product = await Product.findById(orderItem)
        products.push(orderItem);
      }
    }


        const browser = await puppeteer.launch({
            headless: 'new',
          });
          const page = await browser.newPage();
      
          // Render the EJS template with data
          const templatePath = path.join(__dirname, '..', 'views', 'userViews', 'userInvoice.ejs');
      
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          const renderedHtml = ejs.render(templateContent,{
            user,
            products,
            order
          });
      
          // Set the page content to the rendered HTML
          await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });
      
          // Generate PDF
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '20px',
              right: '20px',
              bottom: '20px',
              left: '20px',
            },
          });
      
          // Close the Puppeteer browser
          await browser.close();
      
          // Generate a unique filename for the PDF
          const filename = `userInvoice_${Date.now()}.pdf`;
          const filepath = path.join(__dirname, '..', 'public', filename);
      
          // Save the PDF file
          fs.writeFileSync(filepath, pdfBuffer);
      
          // Download the PDF
          res.download(filepath, (err) => {
            if (err) {
              res.render('404_errorPage', { message: err });
            }
      
            // Delete the generated file after download
            fs.unlink(filepath, (error) => {
              if (error) {
                res.render('404_errorPage', { message: error });
              }
            });
          });
    }catch(err){
        console.log(err.message);
    }
}


module.exports={
    getSignupPage,
    getLoginPage,
    insertUser,
    verifyOtp,
    resendOtp,
    getOtpVerificationPage,
    verifyLogin,
    getGuestHome,
    getUserHome,
    userLogout,
    getForgetPasswordPage,
    verifyForgetphoneNumber,
    verifyForgetOtp,
    getResetPasswordPage,
    resetPassword,
    getUserProfilePage,
    getUserEditPage,
    updateUserProfile,
    applyCoupon,
    getSuccessPage,
    getWalletPage,
    searchProducts,
    getShopByCategoryPage,
    downloadInvoice
  }