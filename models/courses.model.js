import { Schema , model } from "mongoose";

const courseSchema = new Schema({
    title: {
        type: String,
        required: [true , "Tile is required"],
        minLength: [10,'Title must be atleast 10 characters'],
        trim: true
    },
    description: {
        type: String,
        required: [true , "description is required"]
    },
    category: {
        type: String,
        required: [true , "category is required"]
    },
    thumbnail: {
        public_id: {
            type: String,
            required: true
        },
        secure_url: {
            type: String,
            required: true
        }
    },
    lectures: [
        {
            title: String,
            description: String,
            lecture: {
                public_id: {
                    type: String
                },
                secure_url: {
                    type: String
                }
            }
        }
    ],
    numberOfLectures: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true
    }
},{timestamps: true});

const Course = model('Course',courseSchema);

export default Course;