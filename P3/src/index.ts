import express, { Request, Response, NextFunction} from "express";
import { connectMongoDB } from "./mongo";
import rutasAuth from "./routes/auth";
import rutasProducts from "./routes/products"
import rutasCart from "./routes/cart"
import dotenv from "dotenv"

dotenv.config();

connectMongoDB();

const app = express();
app.use(express.json());

app.use((err:Error, req: Request, res: Response, next: NextFunction) => {

  if (err instanceof SyntaxError) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  next();

});

app.use("/api/auth", rutasAuth);
app.use("/api/products", rutasProducts);
app.use("/api/cart", rutasCart); 

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

app.listen(3000, () => console.log("El API ha comenzado"));