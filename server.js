import app from "./app.js";
// import vercelNode from "@vercel/node";
import { config } from "dotenv";
import connectionToDB from "./db_config/db_connection.js";
import pkg from "cloudinary";
const { v2 } = pkg;
// import { v2 } from "cloudinary";
import Razorpay from "razorpay";
// import http from "http";

config();


const PORT = process.env.PORT || 5000;

// cloudinary configuraton
v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

// Razorpay configuraton
export const razorpay = new Razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_SECRET
});


// await connectionToDB();

const App =  app.listen(PORT,async()=>{
    await connectionToDB();
    console.log(`App is running at http://localhost:${PORT}`);
});
export default App;

// module.exports = app;