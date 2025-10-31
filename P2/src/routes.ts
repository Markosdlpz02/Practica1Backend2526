import { Router } from "express";
import { getDb } from "./mongo";
import { ObjectId } from "mongodb";

const router = Router();
const coleccion = () => getDb().collection("Books");

router.get("/", async (req, res) => {
  try {
    const books = await coleccion().find().toArray();
    res.status(200).json(books);
  } catch (err) {
    res.status(404).json(err);
  }
});

router.post(`/`, async (req, res) => {
  try {
    const newTitle = req.body.title;
    const newAuthor = req.body.author;
    const newPages = req.body.pages
    
    if (newTitle && newAuthor && newPages && typeof newTitle === "string" && typeof newAuthor === "string" && typeof newPages === "number" ) {
      const result = await coleccion().insertOne({
        title:newTitle,
        author:newAuthor,
        pages:newPages,
        createdAt: new Date(),
        updatedAt: new Date(),
        
      });
      const idMongo = result.insertedId;
      const BookCreado = await coleccion().findOne({ _id: idMongo });
      res.status(201).json(BookCreado);

    } else {
      res.status(400).json({ message: "Invalid JSON body" });
    }
  } catch (err) {
    res.status(400).json(err);
  }
});

router.put("/:id", async(req,res) => {
    
    try {
    const Title = req.body?.title;
    const Author = req.body?.author;
    const Pages = req.body?.pages
    
    if ((Title && typeof Title === "string") || (Author && typeof Author === "string") || (Pages && typeof Pages === "number")) {
      const result = await coleccion().updateOne(
        {_id: new ObjectId(req.params?.id)},
        {$set: req.body}
        
      );

      const libroActualizado = await coleccion().findOne({id:req.body._id})
      
      
      res.status(200).json({
        _id:libroActualizado?._id,
        title:libroActualizado?.title,
        author:libroActualizado?.author,
        pages:libroActualizado?.pages,
        createdAt: libroActualizado?.createdAt,
        updatedAt: new Date(),
      })

    } else {
      res.status(400).json({ message: "Invalid JSON body" });
    }
  } catch (err) {
    res.status(400).json(err);
  }
})

router.delete("/:id", async(req,res) => {
    try {
      const result = await coleccion().deleteOne(
        {_id: new ObjectId(req.params?.id)},

      );
      res.status(200).json({ message: "Deleted successfully" });
    } catch(err) {
      res.status(404).json(err);
    }
})


export default router;