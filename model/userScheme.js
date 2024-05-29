import mongoose from "mongoose";
import validator from "mongoose-validators";
import JsonWebToken from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        require: [true, "Please Enter Your userName"],
        unique: true,
    },
    phoneNumber: {
        type: Number,
        require: [true, "Please Enter Your phoneNumber"]
    },
    email: {
        type: String,
        require: [true, "Please Enter Your Email"],
        unique: true,
        validate: validator.isEmail()
    },
    password: {
        type: String,
        require: [true, "Please Enter Your Password"]
    },
    confirmPassword: {
        type: String,
        require: [true, "Please Enter Your confirm Password"]
    },
    isSeller: {
        type: String,
        default: "USER"
    },
    date: Number,
    time: Number,
    resetToken: String,
    token: String,
    address: [
        {
            Address: String,
            City: String,
            State: String,
            Pincode: Number,
            Country: Number
        }
    ],
    Review: [
        {
            productId: String,
            userReview: String,
            star: {
                type: String,
                enum: [1, 2, 3, 4, 5]
            },
        }
    ],
    WiseList: [String]
})

userSchema.methods.HashPassword = async (plainPassword) => {
    try {
        return await bcrypt.hash(plainPassword, 12)
    } catch (error) {
        return error;
    }
}


userSchema.methods.isPassword = async (plainPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        return error
    }
}

userSchema.methods.jsonWebToken = async (userId, key) => {
    try {
        const token = await JsonWebToken.sign({ userId }, key);
        return token
    } catch (error) {
        return error;
    }
}

// MiddleWare For Removing The ConfirmPassword AfterValidation And Hashing
userSchema.pre("save", function () {
    this.confirmPassword = null;
})

const userModel = mongoose.model("user", userSchema);

export default userModel;