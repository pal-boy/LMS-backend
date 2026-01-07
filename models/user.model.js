import { Schema , model } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new Schema({
    fullname: {
        type: String,
        required:[true , "Name is required"],
        minLength: [3 , "fullname must be atleast 3 characters long"],
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required:[true , "Email is required"],
        lowercase: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required:[true , "Password is required"],
        select: false
    },
    avatar: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    },
    subscription: {
        id: { type: String, default: null }, // razorpay subscription id
        status: { 
            type: String, 
            enum: ['created','pending','active','cancelled','expired', null], 
            default: null 
        },
        plan_id: { type: String, default: null }, // razorp ay plan id (optional)
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null }
    },
    payments: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Payment' }
    ],
    subscriptions: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Subscription' }
    ],
    role: {
        type: String,
        enum: ['USER','ADMIN'],
        default: 'USER'
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date
},{timestamps: true});

userSchema.pre('save',async function(next){
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
});

userSchema.methods = {
    generateJWTtoken: async function(){
        return await jwt.sign({
            id: this._id,
            email: this.email,
            subscription: this.subscription,
            role: this.role},
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY
            }
        );
    },
    comparePassword: async function (plainTextPassword) {
        // console.log("plain text password",plainTextPassword);
        // console.log("this password",this.password);
        return await bcrypt.compare(plainTextPassword, this.password);
    },
    generatePasswordResetToken: async function(){
        const resetToken = await crypto.randomBytes(20).toString('hex');

        this.forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        this.forgotPasswordExpiry = Date.now()+ 15*60*1000; // 15minutes

        return resetToken;
    }
}

const User = model("User", userSchema);

export default User;