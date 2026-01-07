import {Router} from 'express';
import { authorizedRoles,isLoggedIn } from '../middlewares/auth.middleware.js';
import { buySubscription, cancelSubscription, getAllPayments, getRazorpayApiKey, verifySubscription } from '../controllers/payment.controller.js';

const paymentRouter = Router();

paymentRouter
    .route('/razorpay-key')
    .get(isLoggedIn,getRazorpayApiKey);
    
paymentRouter
    .route('/subscribe')
    .post(isLoggedIn,buySubscription);
    
paymentRouter
    .route('/verify')
    .post(isLoggedIn,verifySubscription);
    
paymentRouter
    .route('/unsubscribe')
    .post(isLoggedIn,cancelSubscription);
    
paymentRouter
    .route('/')
    .get(isLoggedIn,authorizedRoles('ADMIN'),getAllPayments);

export default paymentRouter;