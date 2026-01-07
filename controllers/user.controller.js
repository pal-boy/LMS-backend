import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import AppResponse from "../utils/response.util.js";
import cloudinary from 'cloudinary';
// import upload from '../middlewares/multer.js';
import fs from 'fs/promises'
import sendEmail from "../utils/sendEmail.util.js";
import crypto from 'crypto';

const cookieOptions = {
    maxAge: 7*24*60*60*1000 , // 7 days
    httpOnly: true,
    secure: true
};

const register = async(req,res,next)=>{
    // console.log('Request Body:', req.body);
    const {fullname , email, password} = req.body;

    if (!fullname || !email || !password) {
        return next(new AppError(400 , "All fields are required"));
    }

    const userExists = await User.findOne({email});
    if (userExists) {
        return next(new AppError(401 , "User already exists"));
    }

    const user = await User.create({
        fullname,email,password,
        avatar:{
            public_id: "",
            secure_url: ''
        }
    });
    if (!user) {
        return next(new AppError(401 , "User registration failed")); 
    }

    // file upload
    if (req.file) {
        // console.log("Request File : ",req.file);
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
                height:250,
                width:250,
                gravity: 'faces',
                crop: 'fill'
            });
            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                // remove file from server
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            console.log(error);
            return next(new AppError(400 , "Error while uploading avatar"));
        }
    }
    else{
        console.log("No file uploaded");
    }

    await user.save();

    user.password = undefined;

    const token = await user.generateJWTtoken();
    res.cookie('token' , token, cookieOptions);

    return res.status(200).json(
        new AppResponse(200,user,"User registered successfully")
    );
};


const login = async(req,res,next)=>{
    try {
        const {email, password} = req.body;
    
        if (!email || !password) {
            return next(new AppError(400 , "All fields are required"));
        }
    
        const user = await User.findOne({email}).select('+password');
        if (!user || !user.comparePassword(password)) {
            return next(new AppError(403 , "Email or password does not match"));
        }
    
        const token = await user.generateJWTtoken();
        user.password = undefined;
        res.cookie('token' , token, cookieOptions);
    
        return res.status(200).json(
            new AppResponse(200,user,"User logged in successfully")
        );
    } catch (error) {
        return next(new AppError(407 , error.message));
    }
};



const logout = (req,res)=>{
    res.cookie('token',null,{
        httpOnly: true,
        secure: true,
        maxAge: 0
    });

    return res.status(200).json(
        new AppResponse(200,"User logged out successfully")
    );
};


const getProfile = async(req,res,next)=>{
    try {
        const userId = req.user.id;
        // console.log(userId);
        const user = await User.findById(userId);
        // console.log(user);
        return res.status(200).json(
            new AppResponse(200,user,"User profile fetched successfully")
        );
    } catch (error) {
        return next(new AppError(403 , "Failed to fetch profile details"));
    }
};

const updateProfile = async(req,res,next)=>{
    const{fullName} = req.body;
    const{id} = req.params;

    const user = await User.findById(id);
    if (!user) {
        return next(new AppError(404 , "Invalid user id or User not found"));
    }

    if (fullName) {
        user.fullname = fullName;
    }

    if (req.file) {
        // delete the old image uploaded by the user
        if (user.avatar.public_id) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }

        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
                height:250,
                width:250,
                gravity: 'faces',
                crop: 'fill'
            });
            if (result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                // remove file from server
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (error) {
            return next(new AppError(400 , "Error while uploading avatar"));
        }
    }

    await user.save();

    return res.status(200).json(
        new AppResponse(200,user,"User profile updated successfully")
    );
}

const forgotPassword = async(req,res,next)=>{
    const {email} = req.body;
    if (!email) {
        return next(new AppError(400 , "Email is required."));
    };

    const user = await User.findOne({email});
    if (!user) {
        return next(new AppError(400 , "Email does not exist."));
    };

    const resetToken = await user.generatePasswordResetToken();
    await user.save();

    const resetPasswordURL = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
    console.log(resetPasswordURL);
    const subject = 'Reset Paswword';
    const message = `You can reset your password by clicking link <a href=${resetPasswordURL} target="_blank" > Reset your password </a>`;

    try {
         sendEmail(email,subject,message);

        return res.status(200).json(
            new AppResponse(200,`Reset token password url has been sent to ${email} successfully`)
        );
    } catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save();

        return next(new AppError(500 , "Something went wrong while sending email.",error));
    }
}


const resetPassword = async(req,res,next)=>{
    const {resetToken} = req.params;
    const {resetPassword} = req.body;

    const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    });
    if (!user) {
        return next(new AppError(400 , "Token is invalid or expired! Please try again"));
    };

    user.password = resetPassword;
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    user.save();

    return res.status(200).json(
        new AppResponse(200,"Your password changed successfully")
    );

}

export {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword
}