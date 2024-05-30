import Express from "express";
import dotEnv from "dotenv";
import mongoose from "mongoose";
import multer, { memoryStorage } from "multer";
import cors from "cors";
import userRouter from "./Routes/user.js";
import productRouter from "./Routes/product.js";

const app = Express();

dotEnv.config({ path: "./.env" });
app.use(cors());
app.use(
  cors({
    credentials: true,
    preflightContinue: true,
    allowedHeaders: `http://localhost:5173/`,
    methods: ["POST", "GET", "PATCH"],
  })
);
app.use(Express.json());
const storage = multer.memoryStorage();
const handler = multer({ storage });

//Port Other Secret Keys
const port = process.env.NODE_PORT || 8080;

// User Routes
app.use("/api/v1/auth", userRouter);
app.use("/api/v1/product", handler.array("image", 10), productRouter);

// Mongodb Connection
mongoose
  .connect(`${process.env.NODE_DBU}`)
  .then((res) => {
    console.log(`DB CONNECTED`);
  })
  .catch((error) => {
    console.error(error);
  });
app.listen(port, () => console.log(`Server Is Running In Port-${port}`));
