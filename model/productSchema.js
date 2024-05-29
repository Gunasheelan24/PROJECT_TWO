import { Schema, model } from "mongoose";

const productSchema = new Schema({
    productId: {
        type: Number,
        require: [true, "Please Enter The ProductId"],
        min: [0, "ProductId Must have Atleast 5 Digit"],
        max: [200, "ProductId Must LessThan 10 Digit"]
    },
    imgArray: [String],
    productPrice: { type: Number },
    productDescription: { type: String },
    productName: { type: String },
    signedUrl: [String],
    Category: String,
    Section: String,
    fakePrice: Number,
    color: String
})

const productModel = model("Products", productSchema);

export default productModel;