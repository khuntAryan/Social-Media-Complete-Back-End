import Express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = Express()
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))

app.use(Express.json({
    limit: "16kb"
}))
app.use(Express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(Express.static("public"))
app.use(cookieParser())

// importing router 
import routerUser from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", routerUser)
// we are making these in sepereate files because if we want to access anything inside user 
// such as login user or register user we can access all that once we entre users from here
// so that we don't have to call users again and again 

// you click one and can access all 


export { app }