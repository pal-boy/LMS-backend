import Course from "../models/courses.model.js"
import AppError from "../utils/error.util.js";
import AppResponse from "../utils/response.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises'

const getAllCourses = async(req,res,next)=>{
    try {
        const courses = await Course.find({}).select('-lectures');
        if (!courses) {
            return next(new AppError(400 , "No couses found"));
        }
        return res.status(200).json(
            new AppResponse(200,courses,"All courses fetched successfully")
        );
    } catch (error) {
        return next(new AppError(400 , "Failed to get all courses"));
    }
}


const getCourseById = async(req,res,next)=>{
    try {
        const {id} = req.params;
        const course = await Course.findById(id);

        if (!course) {
            return next(new AppError(400 , "No such couse is exist"));
        }

        return res.status(200).json(
            new AppResponse(200,course.lectures,"Course fetched successfully")
        );
    } catch (error) {
        return next(new AppError(400 , "Failed to get the course"));
    }
}

const createCourses = async(req,res,next)=>{
    const {title , description , category , createdBy} = req.body;
    if (!title || !description || !category || !createdBy) {
        return next(new AppError(400 , "All fields are required"));
    }

    const course = await Course.create({
        title,description,category,createdBy,thumbnail :{
            public_id: 'dummy',
            secure_url: 'dummy'
        }
    });
    
    if (!course) {
        return next(new AppError(500 , "course could not be created"));
    };

    try {
        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: "lms"
            });
            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            };
            fs.rm(`uploads/${req.file.filename}`);
        };  
    } catch (error) {
        return next(new AppError(400 , "Error while uploading course thumbnail"));
    }

    await course.save();
    return res.status(200).json(
        new AppResponse(200,course,"Course created successfully")
    );
    
}


const updateCourse = async(req,res,next)=>{
    try {
        const {id} = req.params;
        const course = await Course.findByIdAndUpdate(id,
            {
            $set: req.body
            },
            {
                runValidators: true
            }
        );
        if (!course) {
            return next(new AppError(400,"Course with the given id does not exist"));
        }

        res.status(200).json(
            new AppResponse(200,course,"Course updated successfully")
        )

    } catch (error) {
        return next(new AppError(500 , "error while updating course"));
    }
}


const removeCourse = async(req,res,next)=>{
    try {
        const {id} = req.params;
        const course = await Course.findByIdAndDelete(id);
        if (!course) {
            return next(new AppError(400,"Course with the given id does not exist"));
        }

        res.status(200).json(
            new AppResponse(200,course,"Course deleted successfully")
        )

    } catch (error) {
        return next(new AppError(500 , "error while deleting course"));
    }
}

const addLecturesToCourseById = async(req,res,next)=>{
    try {
        const {title , description} = req.body;
        const {id} = req.params;
        if (!title || !description) {
            return next(new AppError(400, "All fields are required"));
        }
    
        const course = await Course.findById(id);
        if (!course) {
            return next(new AppError(400,"Course with the given id does not exist"));
        }
    
        const lectureData = {
            title,
            description,
            lecture:{
                public_id: 'dummy',
                secure_url: 'dummy'
            },
        }
    
        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                resource_type: "video",
                folder: "lms"
            });
            if (result) {
                lectureData.lecture.public_id = result.public_id;
                lectureData.lecture.secure_url = result.secure_url;
            };
            fs.rm(`uploads/${req.file.filename}`);
        };
    
        course.lectures.push(lectureData);
        course.numberOfLectures = course.lectures.length;
        await course.save();
    
        res.status(200).json(
            new AppResponse(200,course,"lectures added successfully")
        )
    } catch (error) {
        console.log(error);
        return next(new AppError(500 , "error while uploading lecture"));
    }
}

const deleteLecture = async(req,res,next)=>{
    try {
        const {courseId , lectureId} = req.params;
        const course = await Course.findById(courseId);
        if (!course) {
            return next(new AppError(400,"Course with the given id does not exist"));
        }
        // Check if lecture exists
        const lectureIndex = course.lectures.findIndex(
            (lec) => lec._id.toString() === lectureId
        );
  
        if (lectureIndex === -1) {
            return next(new AppError(400,"Lecture with the given id does not exist"));
        }
  
        // Remove the lecture from the lectures array
        course.lectures.splice(lectureIndex, 1);
  
        // Decrement the number of lectures
        course.numberOfLectures -= 1;
  
        // Save the updated course
        await course.save();

        res.status(200).json(
            new AppResponse(200,course,"Lecture deleted successfully")
        )

    } catch (error) {
        return next(new AppError(500 , "error while deleting lecture"));
    }
}

export {
    getAllCourses,
    getCourseById,
    createCourses,
    updateCourse,
    removeCourse,
    addLecturesToCourseById,
    deleteLecture
}