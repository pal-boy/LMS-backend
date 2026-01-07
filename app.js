import dotenv from 'dotenv';
dotenv.config();
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRouter from "./routes/user.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import Courserouter from "./routes/course.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import contactRouter from './routes/miscellaneous.routes.js';
import adminRouter from './routes/admin.route.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET","POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(cookieParser());

app.use(morgan('dev'));

app.use("/ping",(req,res)=>{
    res.send('/pong');
});

// routes of 4 module
app.use('/api/v1/user' , userRouter);
app.use('/api/v1/courses' , Courserouter);
app.use('/api/v1/payments' , paymentRouter);
app.use('/api/v1/contact' , contactRouter);
app.use('/api/v1/admin' , adminRouter); // to be replaced with admin routes

app.all("*",(req,res)=>{
    res.status(404).send("404\nPage not found");
});

app.use(errorMiddleware);

export default app;