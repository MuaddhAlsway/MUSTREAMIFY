import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    bio:{
        type: String,
        default: ""
    },
    profilePic: {
        type: String,
        default: ""
    },
    nativeLanguage:{
        type: String,
        default: ""
    },
    learningLanguage:{
        type: String,
        default: ""
    },
    location:{
        type: String,
        default: ""
    },
    isOnBoarded:{
        type: Boolean,
        default: false
    },
    friends:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }]
},{timestamps: true});

// createAt, updatedAt
const User = mongoose.model("User", userSchema);


// Pre hook
// John@gmail.com 123456
// TODO: EXPLAIN THIS ONCE AGAIN 
userSchema.pre("save", async function(next) {
    
    if(!this.isModified("password"))
        return next();
    
    try
    {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    }catch(err){}
    next(error)
} )
export default User;
// member since createdAt, updatedAt

