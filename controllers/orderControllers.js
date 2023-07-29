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
const Razorpay = require("razorpay")
var moment = require("moment-timezone")

const getUserOrdersPage=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        console.log("yes mahn");
        const userId=req.params.user_id
        const user=await User.findById(userId)
        const cart=await Cart.findOne({user:userId})
        const order=await Order.findOne({cart:cart._id}).populate("purchasedProducts.product")
        res.render("userOrders",{cart,order,user})
    }catch(err){
        console.log(err.message);
    }
}


const cancelOrder=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId = req.params.user_id
        const user = await User.findById(userId)
        const productId = req.params.product_id
        const product = await Product.findById(productId)
        const orderId = req.params.order_id
        const purchasedProductId = req.params.purchasedProduct_id
        const order = await Order.findById(orderId)

        const purchasedProductIndex=order.purchasedProducts.findIndex((item)=>{
            return item.product.toString() === productId && item._id.toString() === purchasedProductId
        })

        console.log(purchasedProductIndex);

        if (purchasedProductIndex !== -1) {

            const purchasedProduct = order.purchasedProducts[purchasedProductIndex]
            const paymentMethod = purchasedProduct.paymentMethod

            if (paymentMethod === "razor_pay") {
                let wallet = await Wallet.findOne({ user: userId })

                if (!wallet) {
                    wallet = new Wallet({ user: userId })
                }

                wallet.balance += purchasedProduct.quantity * product.price
                order.purchasedProducts[purchasedProductIndex].status = "Cancelled"

                order.purchasedProducts[purchasedProductIndex].cancelledDate = new Date();
                await order.save()

                product.totalStock += order.purchasedProducts[purchasedProductIndex].quantity
                await product.save()

                const credit = {
                    order: orderId,
                    date: purchasedProduct.cancelledDate,
                    productName: product.productName,
                    quantity: purchasedProduct.quantity,
                    amount: purchasedProduct.quantity * product.price,
                  };

                wallet.credits.push(credit);
                await wallet.save()
                console.log("razorPay Amount is Added to the wallet")
                res.redirect(`/userOrders/${user._id}`)

            }else{
                order.purchasedProducts[purchasedProductIndex].status = 'Cancelled';
                order.purchasedProducts[purchasedProductIndex].cancelledDate = new Date();

                await order.save();
                product.totalStock += order.purchasedProducts[purchasedProductIndex].quantity
                await product.save();

                res.redirect(`/userOrders/${user._id}`)

            }  
        }

    }catch(err){
        console.log(err.message);
    }
}

const returnOrder=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const userId = req.params.user_id
        const user = await User.findById(userId)
        const productId = req.params.product_id
        const product = await Product.findById(productId)
        const orderId = req.params.order_id
        const purchasedProductId = req.params.purchasedProducts_id
        const order = await Order.findById(orderId)
        console.log(purchasedProductId)
        const purchasedProductIndex=order.purchasedProducts.findIndex((item)=>{
            return item.product.toString() === productId.toString() && item._id.toString() === purchasedProductId.toString()
        })

        console.log(purchasedProductIndex);

        if (purchasedProductIndex !== -1) {

            const purchasedProduct = order.purchasedProducts[purchasedProductIndex]

            
                let wallet = await Wallet.findOne({ user: userId })

                if (!wallet) {
                    wallet = new Wallet({ user: userId })
                }

                wallet.balance += purchasedProduct.quantity * product.price
                order.purchasedProducts[purchasedProductIndex].status = "Returned"
                order.purchasedProducts[purchasedProductIndex].returnedDate = new Date();
                await order.save()

                console.log("razorPay Amount is Added to the wallet")
                product.totalStock += order.purchasedProducts[purchasedProductIndex].quantity
                await product.save()

                const credit = {
                    order: orderId,
                    date: purchasedProduct.returnedDate,
                    productName: product.productName,
                    quantity: purchasedProduct.quantity,
                    amount: purchasedProduct.quantity * product.price
                  };

                wallet.credits.push(credit)
                await wallet.save()
                
            res.redirect(`/userOrders/${user._id}`)
        }

    }catch(err){
        console.log(err.message);
    }
}

const getAdminOrdersPage=async (req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const orderData=await Order.find()
        .populate("purchasedProducts.product")

        let orders1=[]
        for(let i=0;i<orderData.length;i++){
            orders1[i]=orderData[i].purchasedProducts;
        }

        const orders=[].concat(...orders1)
        
        orders.sort((a, b) => b.date - a.date);
        res.render("adminOrders",{orders,orderData})
    }catch(err){
        console.log(err.message);
    }
}

const updateOrderStatus = async (req, res) => {

    try {
    const purchasedProductId = req.params.purchasedProduct_id;
    const orderData = await Order.find()
    let orderId;
    orderData.forEach(order => {
        order.purchasedProducts.forEach(product => {
            if(product._id.toString() === purchasedProductId.toString()){
                orderId = order._id
            }
        })
    })
    const productId = req.params.product_id
    const product = await Product.findById(productId)
    const order = await Order.findById(orderId)

    const purchasedProductIndex = order.purchasedProducts.findIndex((product) => {
        return product.product.toString() === productId.toString() && product._id.toString() === purchasedProductId.toString()
    })
    const changedStatus = req.body.status
    if (purchasedProductIndex !== -1) {
        order.purchasedProducts[purchasedProductIndex].status = changedStatus;
        await order.save();
    }

      res.redirect('/admin/orders');

    }catch (err) {
        console.log(err.message);
    }
}



module.exports={
    getUserOrdersPage,
    cancelOrder,
    returnOrder,
    getAdminOrdersPage,
    updateOrderStatus,
}