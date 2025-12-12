import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo";
import bcrypt from "bcryptjs";
import { User } from "../types/User";

const COLLECTION = "users";


export const createUser = async (input: { username: string; email: string; password: string }) => {
    const db = getDb();
    const usersCollection = db.collection<User>(COLLECTION);

    const existeEmail = await usersCollection.findOne({email:input.email});

    if(existeEmail){
        throw new Error("El email ya está registrado");
    }

    const existeUsername = await usersCollection.findOne({ username: input.username });

    if(existeUsername){
       throw new Error("El username ya está registrado"); 
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const result = await usersCollection.insertOne({
        username: input.username,
        email: input.email,
        password: passwordHash,
        createdAt: new Date(),
    });

    return {
        _id:result.insertedId,
        username: input.username,
        email: input.email,
        password: passwordHash,
        createdAt: new Date(),
    }
}

export const validateUser = async (email: string, password: string) => {
    const db = getDb();
    const user = await db.collection<User>(COLLECTION).findOne({email});
    if( !user ) return null;

    const mismaPassword = await bcrypt.compare(password, user.password);
    if(!mismaPassword) return null;

    return user;
};

export const findUserById = async (id: string) => {
    const db = getDb();
    return await db.collection<User>(COLLECTION).findOne({_id: new ObjectId(id)})
}
