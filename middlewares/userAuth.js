const isLogin=(req,res,next)=>{
    try{
        if(req.session.user_id){
            next()
        }else{
            res.redirect('/userLogin')
        }
    }catch(err){
        console.log(err.message);
    }
}

const isLogout=(req,res,next)=>{
    if(req.session.user_id){
       return res.redirect('/userHome')
    }
    next()
}

module.exports = {
    isLogin,
    isLogout
}