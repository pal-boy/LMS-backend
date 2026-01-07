import { Schema , model } from "mongoose";

const paymentSchema = new Schema({
    paymentId: {
        type: String,
        required: true
    },
    subscriptionId: {
        type: String,
        required: true 
    },
    signature: {
        type: String,
        required: true 
    }
},{timestamps: true});

const Payment = model("Payment",paymentSchema);

export default Payment;