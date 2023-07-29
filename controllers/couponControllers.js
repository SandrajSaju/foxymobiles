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

const getCouponsPage=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store");
        const coupons=await Coupon.find()
        res.render('coupons',{coupons})
    }catch(err){
        console.log(err.message);
    }
}

const getAddCouponPage=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store");
        const coupons = await Coupon.find()

        res.render("addCoupon",{coupons})
    }catch(err){
        console.log(err.message);
    }
}

const addNewCoupon=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store");

        const {
            code,
            description,
            discountType,
            discountValue,
            minimumOrderAmount,
            maximumDiscountAmount,
            validityStart,
            validityEnd,
            usageLimit
        } = req.body

        const couponData = await Coupon.findOne({ code: req.body.code })
        if (couponData) {
            return res.render("addCoupon", { message: "The same Coupon Code is already Exists" })
        } else{
            const newCoupon = new Coupon({
                code,
                description,
                discountType,
                discountValue,
                minimumOrderAmount,
                maximumDiscountAmount,
                validityStart,
                validityEnd,
                usageLimit
            })
            console.log(newCoupon);
            await newCoupon.save()
            res.redirect('/admin/coupons');
        }

    }catch(err){
        console.log(err.message);
    }
}

const deleteCoupon=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store");
        const couponId=req.params.coupon_id
        const coupon=await Coupon.findById(couponId)
        coupon.is_active=false
        await coupon.save()
        res.redirect('/admin/coupons')
    }catch(err){
        console.log(err.message);
    }
}

const recoverCoupon=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store");
        const couponId=req.params.coupon_id
        const coupon=await Coupon.findById(couponId)
        coupon.is_active=true
        await coupon.save()
        res.redirect('/admin/coupons')
    }catch(err){
        console.log(err.message);
    }
}

module.exports={
    getCouponsPage,
    getAddCouponPage,
    addNewCoupon,
    deleteCoupon,
    recoverCoupon
}