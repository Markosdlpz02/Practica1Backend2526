import { ObjectId } from "mongodb";

export type Project = {
    _id?: ObjectId;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    owner: ObjectId; 
    members: ObjectId[]; 
};