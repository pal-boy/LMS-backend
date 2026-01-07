import {Router} from 'express';
import { addLecturesToCourseById, createCourses, deleteLecture, getAllCourses, getCourseById, removeCourse, updateCourse } from '../controllers/course.controller.js';
import upload from '../middlewares/multer.middleware.js';
import { authorizedRoles, isLoggedIn } from '../middlewares/auth.middleware.js';

const Courserouter = Router();

Courserouter.route('/')
.get(getAllCourses)
.post(isLoggedIn,
    authorizedRoles('ADMIN') ,
    upload.single('thumbnail'),
    createCourses
);

Courserouter.route('/:id')
.get(getCourseById)
.put(isLoggedIn,
    authorizedRoles('ADMIN'),
    updateCourse)
.delete(isLoggedIn,
    authorizedRoles('ADMIN'),
    removeCourse)
.post(isLoggedIn,
    authorizedRoles('ADMIN'),
    upload.single('lecture'),
    addLecturesToCourseById);

Courserouter.route('/:courseId/course/:lectureId').delete(isLoggedIn,
    authorizedRoles('ADMIN'),
    deleteLecture);

export default Courserouter;