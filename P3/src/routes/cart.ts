import { Router, Response } from "express";
import { getDb } from "../mongo";
import { ObjectId } from "mongodb";
import { Cart, Product, JwtPayload} from "../types";
import { AuthRequest, verifyToken } from "../middleware/verifyToken";

const router = Router();

const coleccionCarts = () => getDb().collection<Cart>("carts");
const coleccionProducts = () => getDb().collection<Product>("products");

router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {

    const usuario = req.user as JwtPayload;
    const userId = new ObjectId(usuario.id);

    const cart = await coleccionCarts().findOne({ userId: userId });

    if(!cart){

        return res.status(200).json({
            userId:userId,
            items:[]
        });
    }

    res.status(200).json(cart);

  } catch (err) {
    res.status(404).json(err);
  }
});

router.put("/add", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    
    const usuario = req.user as JwtPayload;
    const userId = new ObjectId(usuario.id);

    const { productId, quantity } = req.body;

    if(!productId || quantity === undefined){
        return res.status(400).json({ message: "productId and quantity are required" });
    }

    if(typeof productId !== 'string' || typeof quantity !== 'number'){
        return res.status(400).json({ message: "Invalid data type"});
    }

    const product = await coleccionProducts().findOne({ _id: new ObjectId(productId)});

    if(!product){
       return res.status(404).json({ message: "Product not found" }); 
    }

    if(product.stock < quantity){
        return res.status(400).json({ message: "Insufficient stock" });
    }

    await coleccionProducts().updateOne(
        {_id: new ObjectId(productId)},
        { $set: { stock: product.stock - quantity}} 
    )

    const cart = await coleccionCarts().findOne({ userId: userId });

    if(!cart){
        await coleccionCarts().insertOne({
            userId:userId,
            items:[{
                productId:new ObjectId(productId),
                quantity:quantity
            }]
        })
    }else{
        const itemIndex = cart.items.findIndex(item => item.productId.equals(new ObjectId(productId)));

        if(itemIndex > -1){
            cart.items[itemIndex].quantity = cart.items[itemIndex].quantity + quantity;
        }else{
            cart.items.push({ 
                productId: new ObjectId(productId),
                quantity: quantity 
            });
        }

        await coleccionCarts().updateOne(
            { _id: cart._id },
            { $set: { items: cart.items } }
        )  
    }

    const updatedCart = await coleccionCarts().findOne({ userId: userId });
    res.status(200).json(updatedCart);

  }catch (err){
    res.status(404).json(err);
  }
});

export default router;