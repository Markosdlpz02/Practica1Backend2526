import { Router, Response } from "express";
import { getDb } from "../mongo";
import { ObjectId } from "mongodb";
import { Product } from "../types";
import { AuthRequest, verifyToken } from "../middleware/verifyToken";

const router = Router();

const coleccionProducts = () => getDb().collection<Product>("products");

router.get("/", async (req, res) => {
  try {

    const products = await coleccionProducts().find().toArray();
    
    res.json(products);

  } catch (err) {
    res.status(404).json(err);
  }
});

router.post("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    
    const { name, description, price, stock } = req.body;

    if(!name || !price || stock === undefined){
        return res.status(400).json({ message: "Name, price, and stock are required" });
    }

    if(typeof name !== "string" || typeof price !== "number" || typeof stock !== "number"){
        return res.status(400).json({ message: "Invalid data type" });
    }

    if(price <= 0 || stock < 0){
        return res.status(400).json({ message: "Price must be > 0 and stock must be >= 0" });
    }

    const newProduct: Product = {
        name,
        price,
        stock,
        createdAt: new Date()
    }

    if(description && typeof description === 'string'){
        newProduct.description = description;
    }

    const result = await coleccionProducts().insertOne(newProduct);
    const productoCreado = await coleccionProducts().findOne({ _id: result.insertedId });

    res.status(201).json(productoCreado);

  }catch (err) {
    res.status(404).json(err);
  }
});

export default router;