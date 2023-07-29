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

const getShippingAddress=async (req,res)=>{
    try{
        res.set("Cache-Control","no-store");
        const userId=req.params.user_id
        const user=await User.findById(userId)
        const cart = await Cart.findOne({ user: userId }).populate("user")
        const order=await Order.findOne({cart:cart._id}).populate("purchasedProducts.product")
        res.render("shippingAddress1",{user,order,cart})
    }catch(err){
        console.log(err.message);
    }
}

const getAddShippingAddressPage=async (req,res)=>{
    try{
        res.set("Cache-Control","no-store");
        const userId=req.params.user_id
        const user=await User.findById(userId)
        const cart = await Cart.findOne({ user: userId }).populate("user")
        const order=await Order.findOne({cart:cart._id}).populate("purchasedProducts.product")
        res.render("addShippingAddress1",{user,order,cart})
    }catch(err){
        console.log(err.message);
    }
}

const insertNewShippingAddress=async (req,res)=>{
    try{
        res.set("Cache-Control","no-store")
        const userId=req.params.user_id;
        const user=await User.findById(userId)
        const {
            name,
            houseName,
            place,
            city,
            district,
            state,
            pinCode,
            phoneNumber
        } = req.body;

        let cart=await Cart.findOne({user:userId})
        const order=await Order.findOne({cart:cart._id})

        if(!order){
            const newOrder=new Order({
                cart: cart._id,
                purchasedProducts: [],
                shippingAddress: [{
                    name,
                    houseName,
                    place,
                    city,
                    district,
                    state,
                    pinCode,
                    phoneNumber
                }]
            })
            await newOrder.save()
        }else{
            const shippingAddress={
                name,
                houseName,
                place,
                city,
                district,
                state,
                pinCode,
                phoneNumber
            }
            order.shippingAddress.push(shippingAddress)
            await order.save()
        }
        res.redirect(`/shippingDetails/${userId}`)

    }catch(err){
        console.log(err.message);
    }
}

const getEditShippingAddressPage=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId = req.params.user_id
        const addressIndex = req.query.addressIndex
        const user = await User.findById(userId)
        const cart = await Cart.findOne({ user: userId })
        const order = await Order.findOne({ cart: cart._id })
        res.render("editShippingAddress1", { user, cart, order, addressIndex })

    }catch(err){
        console.log(err.message);
    }
}

const updateShippingAddress=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId = req.params.user_id
        const addressIndex = req.query.addressIndex

        const {
            name,
            houseName,
            place,
            city,
            district,
            state,
            pinCode,
            phoneNumber
        }=req.body

        const cart=await Cart.findOne({user:userId})
        const order = await Order.findOne({ cart: cart._id })

        if (order) {
            order.shippingAddress[addressIndex].name = name
            order.shippingAddress[addressIndex].houseName = houseName
            order.shippingAddress[addressIndex].place = place;
            order.shippingAddress[addressIndex].city = city
            order.shippingAddress[addressIndex].district = district
            order.shippingAddress[addressIndex].state = state
            order.shippingAddress[addressIndex].pinCode = pinCode
            order.shippingAddress[addressIndex].phoneNumber = phoneNumber

            await order.save()
            res.redirect(`/shippingDetails/${new mongoose.Types.ObjectId(userId)}`)
        }
    }catch(err){
        console.log(err.message);
    }
}

const deleteShippingAddress=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId = req.params.user_id
        const addressIndex = req.query.addressIndex

        const cart=await Cart.findOne({user:userId})
        const order = await Order.findOne({ cart: cart._id })

        console.log(order);

        if (order) {
            order.shippingAddress.splice(addressIndex, 1)
            await order.save()
            res.redirect(`/shippingDetails/${new mongoose.Types.ObjectId(userId)}`)
        }

    }catch(err){
        console.log(err.message);
    }
}




module.exports={
    getShippingAddress,
    getAddShippingAddressPage,
    insertNewShippingAddress,
    getEditShippingAddressPage,
    updateShippingAddress,
    deleteShippingAddress
}