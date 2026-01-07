import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
            required: true,
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course", // Reference to the Course model
            required: true,
        },
        razorpaySubscriptionId: {
            type: String,
            required: true,
            unique: true, // Ensure no duplicate subscriptions
        },
        status: {
            type: String,
            enum: ["pending", "active", "cancelled", "failed"],
            default: "pending",
        },
        startDate: {
            type: Date,
            default: Date.now, // Subscription start date
        },
        endDate: {
            type: Date, // End date for subscription (set after payment confirmation)
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true } // Automatically add createdAt and updatedAt fields
);

const Subscription = mongoose.model("Subscription", SubscriptionSchema);
export default Subscription;
