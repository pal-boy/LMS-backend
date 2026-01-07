// const errorMiddleware = (err,req,res,next)=>{
//     err.statusCode = err.statusCode || 500;
//     err.message = err.message || "Something went wrong";

//     return res.status(err.statusCode).json({
//         success: false,
//         message: err.message,
//         stack: err.stack
//     });
// }

// export default errorMiddleware;


const errorMiddleware = (err, req, res, next) => {
  // If the error is a string, wrap it into an object
  if (typeof err === "string") {
    err = { message: err };
  }

  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Something went wrong";

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorMiddleware;
