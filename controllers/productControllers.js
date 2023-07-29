const mongoose=require('mongoose');
const User=require('../models/userModel');
const axios = require('axios')
const Product=require("../models/productModel");
const Category=require("../models/categoryModel");
const Cart=require("../models/cartModel")
const Offer=require("../models/offerModel")
const Order=require("../models/orderModel")
const Banner=require("../models/bannerModel")
const Coupon=require("../models/couponModel")
const Wallet=require("../models/walletModel")

const getAllProductsPage=async (req,res)=>{
    try{
        const userId=req.params.user_id
        const products=await Product.find({isAvailable:true})
        const categories=await Category.find({isDeleted:false})
        const offers=await Offer.find({isAvailable:true})
        const user=await User.findById(userId)
        const cart=await Cart.findOne({user:userId})
        res.render("allProducts",{products,categories,user,cart,offers});

    }catch(err){
        console.log(err.message);
    }
}

const getProductDetailsPage = async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId=req.params.user_id
        const user=await User.findById(userId)
        const productId=req.params.product_id
        const product=await Product.findById(productId)
        const offer=await Offer.findOne({category:product.category._id})
        const cart=await Cart.findOne({user:userId})
       res.render('productDetails1',{user,product,cart,offer})
    }catch(err){
        console.log(err.message);
    }      
}

const getProductsPage=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const products=await Product.find().populate("category")
        console.log(products[0].category.categoryName);
        console.log(products[1].category.categoryName);
        res.render('products',{products})
    }catch(err){
        console.log(err.message);
    }
}

const getAddProductPage=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const categories=await Category.find({isDeleted:false})
        res.render('addProduct',{categories})
    }catch(err){
        console.log(err.message);
    }
}

const getEditProductPage=async (req,res)=>{
    try{
        const productId=req.params.product_id;
        const product=await Product.findById(productId)
        const category=await Category.find({isDeleted:false})
        res.render('editProduct',{product,category})
    }catch(err){
        console.log(err.message);
    }
}

const deleteSingleImage=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const imageIndex=req.params.imageIndex

        const productId=req.params.product_id;

        const product=await Product.findById(productId)

        product.images.splice(imageIndex,1)
        await product.save()
        const category=await Category.find({isDeleted:false})
        res.render('editProduct',{product,category})
    }catch(err){
        console.log(err.message)
    }
}

const insertProduct=async (req,res)=>{
    try{
        console.log(req.body);
        console.log(req.body.productName);
        const { productName, brand, description, price, category ,offer, color, totalStock } = req.body
        const images=[];
        for(key in req.files){
            const paths=req.files[key][0].path
            images.push(paths.slice(7))
        }
        let existingProduct=await Product.findOne({productName:req.body.productName})
        console.log(existingProduct)
        if(existingProduct){
            const categories=await Category.find({isDeleted:false});
            return res.render('addProduct',{categories,message:"Product already Exixts"})
        }
        const newProduct=new Product({
            productName,
            brand,
            price,
            color,
            offer,
            images,
            description,
            totalStock,
            category,
            isAvailable:true
        })
        await newProduct.save()
        res.redirect('/admin/products')
    }catch(err){
        console.log(err.message);
    }
}

const updateProduct=async (req,res)=>{
    const productId=req.params.product_id;
    const product=await Product.findById(productId)
    const images = product.images
        if (req.files.image1) {
            const paths = req.files.image1[0].path
            images.splice(0, 1, paths.slice(7))
        }
        if (req.files.image2) {
            const paths = req.files.image2[0].path
            images.splice(1, 1, paths.slice(7))
        }
        if (req.files.image3) {
            const paths = req.files.image3[0].path
            images.splice(2, 1, paths.slice(7))
        }

    const updatedData={
        productName:req.body.productName,
        description:req.body.description,
        brand:req.body.brand,
        category:req.body.category,
        color:req.body.color,
        price:req.body.price,
        images,
        totalStock:req.body.totalStock,
        offer:req.body.offer
    }
    await Product.findByIdAndUpdate(productId, updatedData)
    res.redirect("/admin/products")
  }

  const deleteProduct=async (req,res)=>{
    try{
        const productId=req.params.product_id;
        const product=await Product.findById(productId);
        console.log(product.isAvailable);
        product.isAvailable=false;
        await product.save()
        console.log(product.isAvailable);
        res.redirect('/admin/products');
    }catch(err){
        console.log(err.message);
    }
  }

  const recoverProduct = async (req, res) => {
    try {
        const productId = req.params.product_id
        const product = await Product.findById(productId)
        product.isAvailable=true
        await product.save()
        
        res.redirect("/admin/products")
    } catch (error) {
        console.log(error.message)
    }
}

module.exports={
    getAllProductsPage,
    getProductDetailsPage,
    getProductsPage,
    getAddProductPage,
    getEditProductPage,
    deleteSingleImage,
    insertProduct,
    updateProduct,
    deleteProduct,
    recoverProduct
}