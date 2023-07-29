const mongoose=require("mongoose")
const Admin=require("../models/adminModel");
const User=require('../models/userModel');
const Product=require('../models/productModel');
const Category=require("../models/categoryModel");
const Order=require('../models/orderModel')
const Banner=require('../models/bannerModel')
const Coupon=require("../models/couponModel")
const Offer=require("../models/offerModel")
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const getAdminLogin=(req,res)=>{
    res.set("Cache-Control", "no-store")
    res.render('adminLogin')
}

const getAdminHome=async(req,res)=>{
    try{
      res.set("Cache-Control", "no-store")
      const admin = await Admin.findById({ _id: req.session.admin_id });
      const orderData = await Order.find().populate('purchasedProducts.product');
      const categoryData = await Category.find();
      let totalOrders = 0;
      let sales = 0;
      let returns = 0;
      let cancelled = 0;

      orderData.forEach((item) => {
        // totalOrders += item.purchasedProducts.length
        item.purchasedProducts.forEach((product) => {
          totalOrders += product.quantity;
          if (product.status === 'Delivered') {
            sales += product.quantity;
          } else if (product.status === 'Returned') {
            returns += product.quantity;
          } else if (product.status === 'Cancelled') {
            cancelled += product.quantity;
          }
        });
      });

      res.render("adminHome",{
        admin, orderData, totalOrders, sales, returns, cancelled, categoryData
      })
    }catch(err){
      console.log(err);
    }
}


const verifyAdminLogin=async(req,res)=>{
    try{
        res.set("Cache-Control", "no-store")
        const email=req.body.email
        const password=req.body.password
        const admin=await Admin.findOne({email:email})
        if(admin && admin.email===email && admin.password===password){
            req.session.admin_id=admin._id
            res.redirect('/admin/home')
        }else{
            res.render("adminlogin",{message:"Incorrect Email or Password"})
        }
    }catch(err){
        console.log(err.message);
    }
}

const getAdminLogout=(req,res,next)=>{
    req.session.admin_id=null
    res.redirect('/admin')
}


const getUserList=async (req,res,next)=>{
    try{
        res.set("Cache-Control", "no-store")
        const users=await User.find()
        res.render('users',{users:users})
    }catch(err){
        console.log(err.message);
    }
}

const blockUser=async(req,res)=>{
    try{
    res.set("Cache-Control", "no-store")

    const userId=req.params.user_id
    const user=await User.findById(userId)
    user.isBlocked=true
    await user.save()
    req.session.user_id=null
    res.redirect('/admin/users')
    }catch(err){
        console.log(err.message);
    }
}

const unblockUser=async(req,res)=>{
    try{
    const userId=req.params.user_id
    const user=await User.findById(userId)
    user.isBlocked=false
    await user.save()
    res.redirect('/admin/users')
    }catch(err){
        console.log(err.message);
    }
}




const getCategoriesPage=async(req,res)=>{
    try{
        const categories=await Category.find();
        res.render("categories",{categories})
    }catch(err){
        console.log(err.message);
    }
}

const addCategory = async (req, res) => {
    try {
        const name=req.body.categoryName;
        if(name.length===0){
            const categories=await Category.find({isDeleted:false});
            return res.render( "categories",{categories,message:"Please provide a Category Name"});
        }
        const newCategory = new Category({
        categoryName: req.body.categoryName.toUpperCase()
      });
      const existingCategory = await Category.findOne({ categoryName: req.body.categoryName.toUpperCase(), isDeleted: false });
      if (!existingCategory) {
        await newCategory.save();
        res.redirect('/admin/categories');
      } else {
        const categories=await Category.find({isDeleted:false});
        res.render( "categories",{categories,message:"Category Already Exists"});
      }
    } catch (err) {
      console.log(err.message);
    }
  };
  

  const unlistCategory=async (req,res)=>{
    const categoryId=req.params.category_id
    const category= await Category.findById(categoryId)
    console.log(category);
    category.isDeleted=true
    await category.save()
    const categoryProducts=await Product.find({category:categoryId})
    console.log(categoryProducts);
    categoryProducts.forEach((item)=>{
        item.isAvailable=false
        item.save()
    })
    res.redirect('/admin/categories')
  }

  const listCategory=async (req,res)=>{
    const categoryId=req.params.category_id
    const category= await Category.findById(categoryId)
    console.log(category);
    category.isDeleted=false
    await category.save()
    const categoryProducts=await Product.find({category:categoryId})
    console.log(categoryProducts);
    categoryProducts.forEach((item)=>{
        item.isAvailable=true
        item.save()
    })
    res.redirect('/admin/categories')
  }

 



const getBannersPage=async(req,res)=>{
    try{
        res.set("Cache-Control","no-store")
        const banners=await Banner.find().populate("category")
        const categories=await Category.find()
        res.render('banners',{banners,categories})
    }catch(err){
        console.log(err.message);
    }
}

const addNewBanner = async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store');
      const bannerTitle = req.body.title;
      const existingBanner = await Banner.findOne({ title: bannerTitle });
      const categories = await Category.find();
      const categoryName = req.body.category;
      const banners=await Banner.find().populate("category")
  
      if (existingBanner) {
        return res.render('banners', {
          message: 'Same Banner Title Already exists',
          categories,
          banners
        });
      }
  
      let paths = '';
      if (req.file) {
        paths = req.file.path.slice(6);
      } else {
        return res.render('banners', {
          message: 'Banner image is required',
          categories,
          banners
        });
      }
  
      const newBanner = new Banner({
        title: bannerTitle,
        description: req.body.description,
        category: req.body.category,
        link: `/shop/${categoryName}`,
        bannerImage: paths,
        isActive: true,
      });
  
      await newBanner.save();
      res.redirect("/admin/banners")
    } catch (err) {
      console.log(err.message);
    }
  };
  
  
  const deleteBanner = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store")
        const bannerId = req.params.banner_id
        const banner = await Banner.findById(bannerId)
        banner.isActive = false
        await banner.save()
        res.redirect("/admin/banners")
    } catch (error) {
        console.log(error.message)
    }
}

const recoverBanner = async (req, res) => {
    try {
        res.set("Cache-Control", "no-store")
        const bannerId = req.params.banner_id
        const banner = await Banner.findById(bannerId)
        banner.isActive = true
        await banner.save()
        res.redirect("/admin/banners")
    } catch (error) {
        console.log(error.message)
    }
}

const getMoreDashboardPage=async (req,res)=>{
  try{
    res.set('Cache-Control', 'no-store');
    const userData = await User.find();
    const orderData = await Order.find().populate('purchasedProducts.product');
    const categoryData = await Category.find();

    let userCount = 0;
    let totalRevenue = 0;
    let activeUsers = 0;
    let codRevenue = 0;
    let razor_payRevenue = 0;

    userData.forEach((user) => {
      if (user.isBlocked === false) {
        userCount++;
      }
    });

    orderData.forEach((order) => {
      order.purchasedProducts.forEach((product) => {
        if (product.status === 'Delivered') {
          totalRevenue += (product.quantity * product.product.price);
          if (product.paymentMethod === 'COD') {
            codRevenue += (product.quantity * product.product.price);
          } else if (product.paymentMethod === 'razor_pay') {
            razor_payRevenue += (product.quantity * product.product.price);
          }
        }
      });
    });

    if (req.session.user_id !== undefined && req.session.user_id !== null) {
      activeUsers++;
    }
    const salesAmount = [];
    categoryData.forEach((category) => {
      let sales = 0;
      orderData.forEach((order) => {
        order.purchasedProducts.forEach((product) => {
          if (product.product.category.toString() === category._id.toString()) {
            if (product.status === 'Delivered') {
              sales += (product.quantity * product.product.price);
            }
          }
        });
      });
      salesAmount.push(sales);
    });


    const categorySales = salesAmount;

    const week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const year = ['2021', '2022', '2023', '2024', '2025', '2026', '2027'];
    const daySales = new Array(week.length).fill(0);
    const monthSales = new Array(month.length).fill(0);
    const yearSales = new Array(year.length).fill(0);

    orderData.forEach((order) => {
      order.purchasedProducts.forEach((product) => {
        const date = new Date(product.date);
        const purchasedWeek = getWeek(date);
        const currentDate = new Date();
        const currentWeek = getWeek(currentDate);
        const index = week.indexOf(week[date.getDay()]);

        if (purchasedWeek === currentWeek) {
          if (product.status !== 'Cancelled' && product.status !== 'Returned') {
            daySales[index] += product.quantity;
          }
        }
      });
    });

    orderData.forEach((order) => {
      order.purchasedProducts.forEach((product) => {
        const date = new Date(product.date);
        const purchasedMonthIndex = date.getMonth();
        if (product.status !== 'Cancelled' && product.status !== 'Returned') {
          monthSales[purchasedMonthIndex] += product.quantity;
        }
      });
    });

    orderData.forEach((order) => {
      order.purchasedProducts.forEach((product) => {
        const date = new Date(product.date);
        const purchasedYear = date.getFullYear().toString();
        const purchasedYearIndex = year.indexOf(purchasedYear);
        if (product.status !== 'Cancelled' && product.status !== 'Returned') {
          yearSales[purchasedYearIndex] += product.quantity;
        }
      });
    });

    function getWeek(date) {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const daysOffset = firstDayOfYear.getDay() - 1;
      const firstWeekDayOne = new Date(date.getFullYear(), 0, 1 + (7 - daysOffset));
      const weekNumber = Math.floor(((date - firstWeekDayOne) / 86400000) / 7);
      return weekNumber;
    }

    res.render('moreDashboard', {
      userData, orderData, categoryData, userCount, totalRevenue, activeUsers, codRevenue, razor_payRevenue, categorySales, daySales, monthSales, yearSales
    });
  }catch(err){
    console.log(err.message);
  }
}

const getSalesFilterPage=async(req,res)=>{
  try {
    res.set('Cache-Control', 'no-store');
    res.render('salesFilter')
  } catch (error) {
    console.log(error.message);
  }
}

const getSalesReportPage=async (req,res)=>{
  try {
    res.set('Cache-Control', 'no-store');
    const orderData = await Order.find().populate('purchasedProducts.product');
    const startDate = req.query.from;
    const endDate = req.query.to;

    res.render('salesReport', { startDate, endDate, orderData });
  } catch (error) {
    console.log(error.message);
  }
}

const downloadSalesReport = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const orderData = await Order.find().populate('purchasedProducts.product');
    const startDate = req.query.from;
    const endDate = req.query.to;

    const browser = await puppeteer.launch({
      headless: 'new',
    });
    const page = await browser.newPage();

    // Render the EJS template with data
    const templatePath = path.join(__dirname, '..', 'views', 'adminViews', 'salesReportPDF.ejs');

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const renderedHtml = ejs.render(templateContent, {
      orderData,
      startDate,
      endDate,
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
    const filename = `sales_report_${Date.now()}.pdf`;
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
  } catch (error) {
    res.render('404_errorPage', { message: error.message });
  }
};

const getAdminOffersPage=async(req,res)=>{
   try{
    res.set('Cache-Control', 'no-store');
    const offers=await Offer.find().populate('category')
    res.render('adminOffer',{offers})
  }catch(err){
    console.log(err.message);
  }
}

const getAddOfferPage=async(req,res)=>{
  try{
    res.set('Cache-Control', 'no-store');
    const categories=await Category.find()
    res.render('addAdminOffer',{categories})
  }catch(err){
    console.log(err.message);
  }
}

const insertNewOffer=async(req,res)=>{
  try{
    const productData = await Product.find();
    const categoryData = await Category.find();
    const {
      offerTitle,
      category,
      offerDiscount,
      startDate,
      endDate,
    } = req.body; 

    const currentDate = new Date();
    const offerEndDate = new Date(endDate);

    if (currentDate > offerEndDate) {
      res.render('addAdminOffer', { message: 'End date of the offer has already passed', products: productData, categories: categoryData });
      return;
    }
    const newOffer = new Offer({
      offerTitle,
      category,
      offerDiscount,
      startDate,
      endDate
    });
    await newOffer.save();
    res.redirect('/admin/offers')
  }catch(err){
    console.log(err.message);
  }
}

const deleteOffer=async(req,res)=>{
  try{
    const offerId=req.params.offer_id;
    console.log(offerId);
    await Offer.deleteOne({ _id: offerId });
    const offers=await Offer.find().populate('category')
    res.render('adminOffer',{offers})
  }catch(err){
    console.log(err.message);
  }
}

module.exports={
    getAdminLogin,
    verifyAdminLogin,
    getAdminHome,
    getAdminLogout,
    getUserList,
    blockUser,
    unblockUser,
    unlistCategory,
    listCategory,
    getCategoriesPage,
    addCategory,
    getBannersPage,
    addNewBanner,
    deleteBanner,
    recoverBanner,
    getMoreDashboardPage,
    getSalesFilterPage,
    getSalesReportPage,
    downloadSalesReport,
    getAdminOffersPage,
    getAddOfferPage,
    insertNewOffer,
    deleteOffer
}