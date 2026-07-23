function requireAdmin(req, res, next) {
    try {
        if(!req.user.isAdmin) {
            return res.status(403).json({msg:"Access Forbidden!"})
        }
        next()
    } catch(err) {
        next(err)
    }
}

module.exports = requireAdmin;