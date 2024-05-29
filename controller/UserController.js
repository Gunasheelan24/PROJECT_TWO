import axios from "axios";
import sendGrid from "@sendgrid/mail";
import userModel from "../model/userScheme.js";


export const createAccountController = async (req, res) => {
    try {
        const { userName, phoneNumber, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            res.status(404).json({ errorMessage: "Password And ConfirmPassword Are Not Same" })
        } else {
            const getUser = await userModel.findOne({ email })
            if (!getUser) {
                const newUser = new userModel({
                    userName,
                    phoneNumber,
                    email,
                })
                const Npassword = await newUser.HashPassword(password);
                if (req.query.type) {
                    newUser.isSeller = "ADMIN"
                }
                newUser.password = Npassword;
                newUser.confirmPassword = Npassword;
                newUser.save();
                res.status(201).json({
                    message: "user created"
                })
            } else {
                res.status(404).json({
                    errorMessage: "email Already Exist"
                })
            }
        }
    } catch (error) {
        res.status(404).json({
            error
        })
    }
}

export const signInController = async (req, res) => {
    const jwt = process.env.NODE_JWT;
    try {
        const { email, password } = req.body;
        const getUser = await userModel.findOne({ email });
        if (getUser) {
            const verified = await getUser.isPassword(password, getUser.password);
            if (verified) {
                const isToken = await getUser.jsonWebToken(getUser._id, jwt);
                res.status(200).json({
                    status: "Welcome Back",
                    token: isToken
                })
            } else {
                res.status(400).json({
                    errorMessage: "Your Password Is InCorrect"
                })
            }
        } else {
            res.status(400).json({
                errorMessage: "Email Not Exist"
            })
        }
    } catch (error) {
        res.status(404).json({
            error
        })
    }
}

export const forgetPasswordController = async (req, res) => {
    const mailKey = process.env.NODE_MAIL;
    sendGrid.setApiKey(mailKey);
    try {
        const { email } = req.body;
        const isEmail = await userModel.findOne({ email });
        if (isEmail) {
            const getOneRandom = Math.floor(Math.random() * 10);
            const getTwoRandom = Math.floor(Math.random() * 10);
            const getThreeRandom = Math.floor(Math.random() * 10);
            const getFourRandom = Math.floor(Math.random() * 10);
            const otp = `${getOneRandom} ${getTwoRandom} ${getThreeRandom} ${getFourRandom}`;
            const response = await axios.get(`http://worldtimeapi.org/api/ip`);
            if (response.status === 200) {
                const removeSymbols = (getTime, getData) => {
                    if (getData) {
                        const newDate = [];
                        for (let i = 0; i < getData.length; i++) {
                            if (getData[i] !== "-") {
                                newDate.push(getData[i]);
                            }
                        }
                        return newDate.join("");
                    } else {
                        const newTime = [];
                        for (let i = 0; i < getTime.length; i++) {
                            if (getTime[i] !== ":") {
                                newTime.push(getTime[i]);
                            }
                        }
                        return newTime.join("")
                    }
                }
                let time = removeSymbols(response.data.datetime.split("").slice(11, 16).join(""), null) * 1;
                let convertedHour;
                if (time.toString().length === 3) {
                    convertedHour = time.toString().slice(0, 1) * 1;
                    convertedHour += 1;
                    time = `${convertedHour}`
                } else {
                    convertedHour = time.toString().slice(0, 2) * 1;
                    convertedHour += 1;
                    time = `${convertedHour}`
                }
                const date = removeSymbols(null, response.data.datetime.split("").slice(5, 10)) * 1;
                const tokenOtp = otp;
                isEmail.date = date;
                isEmail.time = time;
                const sendTransport = {
                    from: "gunasheelan1624@gmail.com",
                    to: isEmail.email,
                    subject: "Your Nexify password reset request",
                    html: `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Nexify</title>
                        <link rel="preconnect" href="https://fonts.googleapis.com">
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                        <link
                            href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
                            rel="stylesheet">
                    </head>
                    <body>
                        <div style="display: flex;justify-content: center;margin-top: 10px;">
                            <img src="/public/woman.png" width="190px" alt="">
                        </div>
                        <div style="display: flex;justify-content: center;margin-top: 10px;">
                            <div style="border: 1px solid black;width: 70%;border-radius: 5px;padding:0 20px 0 20px;">
                                <p style="font-size: 1.4rem;margin-bottom: 4px;font-family: Poppins, sans-serif;font-size: 1.3rem;">Hello
                                    ${isEmail.email}
                                </p>
                                <p style="font-family: Poppins, sans-serif; font-size: 0.9rem;margin-top: 0;margin-bottom:0">A request has been received to
                                    change the
                                    password for your
                                    Nexify account.</p>
                                <p style="font-family: Poppins, sans-serif; font-size: 0.9rem;margin-top: 0;">
                                    Your Otp Is: ${tokenOtp}
                                </p>
                                <div style=" display: flex;justify-content: center;margin-bottom: 10px;">
                                    <button
                                        style="cursor: pointer;background-color: black;color: whitesmoke;padding: 12px;border-radius: 5px;border: none;font-size: 1rem;">Reset
                                        Password</button>
                                </div>
                                <p style="font-family: poppins, sans-serif;margin-bottom: 0;text-align: end;text-decoration: underline;">
                                    Thank You</p>
                                <p style="font-family: poppins, sans-serif;margin-top: 0;text-align: end;text-decoration: underline;">The
                                    Nexify Team</p>
                            </div>
                        </div>
                    </body>
                    </html>`
                }
                await sendGrid.send(sendTransport);
                isEmail.resetToken = tokenOtp;
                isEmail.save();
                res.status(200).json({
                    Message: "Please Check Your Email Address",
                })
            } else {
                res.status(404).json({
                    error: "Internal Server Error"
                })
            }
        } else {
            res.status(404).json({
                error: "Email Not Found"
            })
        }
    } catch (error) {
        res.status(404).json({
            error: error
        })
    }
}

export const resetPasswordController = async (req, res) => {
    try {
        const { email, otp, password, confirmPassword } = req.params;
        if (password !== confirmPassword) res.status(402).json({ message: "Please Check Your Password And Confirm Password" })
        const user = await userModel.findOne({ email });
        if (user) {
            if (user.resetToken && user.resetToken === otp) {
                const getCurrentTime = await axios.get(`http://worldtimeapi.org/api/ip`);
                const response = getCurrentTime.data.datetime;
                const filterHour = response.split("").slice(11, 14);
                let count = 0;
                let arr = [];
                while (count < filterHour.length && filterHour[count] !== ":") {
                    arr.push(filterHour[count]);
                    count++
                }
                const hour = arr.join("") * 1;
                const expire = user.time;
                if (expire > hour) {
                    const hash = await user.HashPassword(password);
                    user.password = hash;
                    user.confirmPassword = hash;
                    user.date = null;
                    user.time = null;
                    user.resetToken = null
                    user.save()
                    res.status(201).json({
                        status: "Success",
                        message: "Password Changed Successfull"
                    })
                } else {
                    res.status(404).json({
                        message: "Your Token Is Expired"
                    })
                }
            } else {
                res.status(404).json({
                    status: 402,
                    message: "unAuthorization"
                })
            }
        } else {
            res.status(404).json({
                status: 404,
                message: "User Not Fount"
            })
        }
    } catch (error) {
        res.status(404).json({
            errorMessage: error
        })
    }
}

const adminController = async (req, res) => {
    try {
        const { email } = req.body
        const Seller = await userModel.findOne({ email });
        if (!Seller) {
            res.redirect(307, `/api/v1/auth/createuser?type=${"admin"}`);
        } else if (Seller.isSeller !== "ADMIN") {
            Seller.isSeller = "ADMIN";
            Seller.save();
            sendGrid.send({
                from: "gunasheelan1624@gmail.com",
                to: email,
                subject: "🪻YOU ARE NOW ADMIN AN AUTHORIZED ADMIN BY NEXIFY",
                text: "You Are Now An Admin"
            })
            res.status(201).json({
                status: 201,
                Message: "Admin Created Successfull"
            })
        } else {
            res.status(409).json({
                statusCode: 409,
                ErrorMessage: "You Are Already an Admin"
            })
        }
    } catch (error) {
        res.status(404).json({
            errorMessage: error
        })
    }
}

export default adminController;