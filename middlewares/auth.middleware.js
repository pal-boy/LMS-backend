import AppError from "../utils/error.util.js";
import jwt from 'jsonwebtoken'

const isLoggedIn = async(req,res,next)=>{
    const {token} = req.cookies;
    
    if (!token) {
        return next(new AppError(406 , "Unauthenticated , Please login"));
    };

    const userDetails = await jwt.verify(token , process.env.JWT_SECRET);
    req.user = userDetails;

    next();
}

const authorizedRoles = (...roles) => async(req,res,next)=>{
    const currentUserRoles = req.user.role;
    if (!roles.includes(currentUserRoles)) {
        return next(
            new AppError(400,"You don't have permission to access this route")
        )
    };

    next();
}

export {
    isLoggedIn,
    authorizedRoles
}