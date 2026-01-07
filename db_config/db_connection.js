import mongoose from "mongoose";
import app from "../app.js";

mongoose.set('strictQuery' , false);

let isConnected = false;

const connectionToDB = async()=>{
 try {
    const {connection} = await mongoose.connect(process.env.MONGO_URI);
    if(connection){
      isConnected = true;
      console.log(`Database connected successfully : ${connection.host}`);
    }
 } catch (error) {
    console.log("MongoDB connection eroor : ",error);
    process.exit(1);
 }
};

app.use((req,res,next)=>{
    if(!isConnected){
         connectionToDB();
    }
    next();
});

export default connectionToDB;