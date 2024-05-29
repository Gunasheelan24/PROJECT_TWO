import Express from "express";
import productModel from "../model/productSchema.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto";


const productRouter = Express.Router();

productRouter.post("/addItems", async (req, res) => {
    try {
        const accessKeyId = process.env.NODE_AWSKEY;
        const secretAccessKey = process.env.NODE_AWSSECRETKEY;
        const s3 = new S3Client({
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            region: "ap-south-1"
        })

        const {
            productName,
            productPrice,
            productDescription,
            productId,
            section,
            color,
            fakePrice,
            wear } = req.body;

        const secretCrypto = process.env.NODE_CRYPTOSECRET;
        const generateRandom = (fileName) => {
            return crypto.createHmac("sha256", secretCrypto).update(fileName).digest("hex")
        }
        const files = req.files;
        const keyArray = [];
        for (let key of files) {
            const randomKey = generateRandom(key.originalname);
            keyArray.push(randomKey);
            const params = new PutObjectCommand({
                Key: randomKey,
                Body: key.buffer,
                ContentType: key.mimetype,
                Bucket: "nexify-shopping"
            })
            await s3.send(params);
        }
        await productModel.create({
            productName: productName,
            productPrice,
            productId,
            productDescription,
            Section: section,
            Category: wear,
            imgArray: keyArray,
            color,
            fakePrice
        })
        res.status(201).json({
            statusCode: 200,
            message: "Product Added Successfull"
        })
    } catch (error) {
        res.status(404).json({
            errorMessage: error
        })
    }
})

productRouter.get("/getProduct", async (req, res) => {
    try {
        // Amazon S3 Configuration
        const accessKeyId = process.env.NODE_AWSKEY;
        const secretAccessKey = process.env.NODE_AWSSECRETKEY;

        const s3 = new S3Client({
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            region: "ap-south-1"
        })
        // Amazon S3 Config End 

        // Get EveryThing For My Database
        const getProduct = await productModel.find({});
        await productModel.updateMany({ signedUrl: [] });
        for (let key of getProduct) {
            for (let img of key.imgArray) {
                const getParams = new GetObjectCommand({
                    Key: img,
                    Bucket: 'nexify-shopping'
                })
                const response = await getSignedUrl(s3, getParams);
                await productModel.updateOne({ _id: key._id }, { $push: { signedUrl: response } });
            }
        }
        const sendResponse = await productModel.find();
        res.status(200).json({
            statusCode: 200,
            message: "Successfull",
            ResultCount: sendResponse.length,
            sendResponse
        })
    } catch (error) {
        res.status(404).json({
            errorMessage: error
        })
    }
})


productRouter.get("/getProduct/filter", async (req, res) => {
    try {
        const query = req.query;

        // Gender Filter
        let gender = "men";
        if (query.gender) {
            if (query.gender === "men") {
                gender = "men"
            } else if (query.gender === "women") {
                gender = "women"
            } else if (query.gener === "kids") {
                gender = "kids"
            }
        }

        // Limit and offset for PageNation
        let limitResult = 0;
        if (query.limit) {
            const limitation = query.limit * 1;
            const result = limitation * 5
            limitResult = result;
        }

        let offsetResult = 0;
        if (query.limit && query.offset && query.limit >= 2) {
            const limitation = query.offset * 1;
            const result = limitation * 5;
            offsetResult = result;
        }

        //Sending Response To FrontEnd 
        let response;
        if (query.gender && !query.priceFrom && !query.priceTo) {
            response = await productModel.find().where("Section").equals(gender).limit(limitResult).skip(offsetResult)
        }
        else if (query.gender && query.priceFrom && query.priceTo) {
            response = await productModel.find({ Section: gender }).where("productPrice").gte(query.priceFrom).lte(query.priceTo);
        } {
            response = await productModel.find().limit(limitResult).skip(offsetResult);
        }

        res.status(200).json({
            statusCode: 201,
            results: response.length,
            response: response
        })

    } catch (error) {
        res.status(404).json({
            statusCode: 404,
            errorMessage: error
        })
    }
})


export default productRouter;