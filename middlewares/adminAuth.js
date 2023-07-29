const isAdminLogin=(req,res,next)=>{
    if(req.session.admin_id){
        next()
    }else{
        res.redirect('/admin')
    }
}

const isAdminLogout=(req,res,next)=>{
    if(req.session.admin_id){
        res.redirect('/admin/home')
    }
    next()
}

module.exports = {
    isAdminLogin,
    isAdminLogout
}