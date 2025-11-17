import { Router } from "express";
import { connectMongoDB, getDb } from "../mongo";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User, JwtPayload } from "../types";

const router = Router();

dotenv.config();

const SECRET = process.env.SECRET;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

const coleccion = () => getDb().collection<User>("Users");

router.post("/register", async (req, res) => {
    try{

        const { username, email, password } = req.body;

        if(!username || !email || !password){
            return res.status(400).json({ message: "Username, email, and password are required" });
        }

        if(typeof username !== "string" || typeof email !== "string" || typeof password !== "string"){
            return res.status(400).json({ message: "Invalid data type" });
        }

        if(!emailRegex.test(email)){
            return res.status(400).json({ message: "Invalid email format" });
        }

        const users = coleccion();

        const existsEmail = await users.findOne({email});
        const existsUsername = await users.findOne({username});

        if(existsEmail){
            return res.status(409).json({message: "Email alrady registered"})
        };

        if(existsUsername){
            return res.status(409).json({message: "Username alrady registered"})
        }

        const passwordHash = await bcrypt.hash(password,10);

        await users.insertOne({
            username,
            email,
            passwordHash,
            createdAt: new Date()
        });

        res.status(201).json({ message: "User created" });

    }catch(err){
        res.status(500).json({message: err});
    }
});

router.post("/login", async (req, res)=>{ 
    try{

        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({ message: "Email and password are required" });
        }
        
        const users = coleccion()
        const user = await users.findOne({email});
        if(!user) return res.status(404).json({message: "Incorrect email"});

        const validPass = await bcrypt.compare(password, user.passwordHash);
        if(!validPass) return res.status(404).json({message: "Incorrect password"});

        const token = jwt.sign({id: user._id?.toString(), email: user.email} as JwtPayload, SECRET as string, {
            expiresIn: "1h"
        });

        res.status(200).json({ token });

    }catch(err){
        res.status(500).json({message: err});
    }
})

export default router;