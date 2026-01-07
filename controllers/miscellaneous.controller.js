import nodemailer from 'nodemailer';
import AppError from "../utils/error.util.js";
import AppResponse from "../utils/response.util.js";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configure the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use any email service
    auth: {
        user: process.env.CONTACT_US_EMAIL, // Your email address
        pass: process.env.EMAIL_PASS  // Your email password
    }
});

const contactUs = async (req, res,next) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return next(new AppError(400 , "All fields are required"));
    };
    
    // send email to admin
    const adminMailOptions = {
        from: `${email}`, // Admin email address
        to: process.env.CONTACT_US_EMAIL, 
        subject: 'New Contact Us Message',
        text: `You have received a new message from ${name} (${email}):\n\n${message}`
    };

    // send email to user
    const userMailOptions = {
        from: process.env.CONTACT_US_EMAIL,
        to: `${email}`,
        subject: 'Thank you for contacting us',
        text: `Dear ${name},\n\nThank you for reaching out to us. We have received your message and will get back to you shortly.\n\nBest regards`
    };

    try {
        // Send email to admin
        transporter.sendMail(adminMailOptions);

        // Send email to user
        transporter.sendMail(userMailOptions);

        return res.status(200).json(
            new AppResponse(200, "Response submitted successfully")
        );
    } catch (error) {
        return next(new AppError(500, "Failed to send emails"));
    }
}

export {
    contactUs
}