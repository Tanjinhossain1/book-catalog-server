const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');

require('dotenv').config();

const app = express();
const port = 5000;

const cors = require('cors');

app.use(cors());
app.use(express.json());

const dbUri = process.env.MONGODB_URL;

const client = new MongoClient(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db('book-catalog');
    const bookCollection = db.collection('books'); 

    app.get('/books', async (req, res) => {
      const cursor = bookCollection.find({});
      const books = await cursor.toArray(); 
      
      res.send({ status: true, data: books });
    });

    app.post('/book', async (req, res) => { 
      const bookDetail = req.body;
      const result = await bookCollection.insertOne(bookDetail);

      res.send(result);
    });

    app.patch('/book/:id', async (req, res) => {
      const bookDetail = req.body;
      const result = await bookCollection.findOneAndUpdate(
        { _id: ObjectId(req.params.id) },
        { $set: bookDetail },  
        { returnOriginal: false }  
      );
      res.send(result);
    });

    app.get('/book/:id', async (req, res) => {
      const id = req.params.id;

      const result = await bookCollection.findOne({ _id: ObjectId(id) }); 
      res.send(result);
    });

    app.delete('/book/:id', async (req, res) => {
      const id = req.params.id;

      const result = await bookCollection.deleteOne({ _id: ObjectId(id) }); 
      res.send(result);
    });

    app.post('/reviews/:id', async (req, res) => {
      const bookId = req.params.id;
      const review = req.body.reviews;
 
      const result = await bookCollection.updateOne(
        { _id: ObjectId(bookId) },
        { $push: { reviews: review } }
      );
 

      if (result.modifiedCount !== 1) { 
        res.json({ error: 'Book not found' });
        return;
      } 
      res.json({ message: 'Added Reviews successfully' });
    });

    app.get('/review/:id', async (req, res) => {
      const bookId = req.params.id;
      
      const result = await bookCollection.findOne(
        { _id: ObjectId(bookId) },
        { projection: { reviews: 1 } }
      )

      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'book not found' });
      }
    });

    app.post('/wishlist/:id', async (req, res) => {
      const bookId = req.params.id;
      const wishlist = req.body.wishlist;
 
      const result = await bookCollection.updateOne(
        { _id: ObjectId(bookId) },
        { $push: { wishlist: wishlist } }
      );
 

      if (result.modifiedCount !== 1) { 
        res.json({ error: 'Book not found' });
        return;
      } 
      res.json({ message: 'Added WishList successfully' });
    });

    app.get('/wishlist/:email', async (req, res) => {
      const userEmail = req.params.email;
    
      const result = await bookCollection.aggregate([
        {
          $match: {
            "wishlist.wishListUser": userEmail
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            author: 1,
            genre: 1,
            publicationDate: 1,
            wishlist: {
              $filter: {
                input: "$wishlist",
                as: "item",
                cond: { $eq: ["$$item.wishListUser", userEmail] }
              }
            }
          }
        }
      ]).toArray();
    
      if (result && result.length > 0) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'wishlist not found' });
      }
    });
    app.delete('/wishlist/:wishlistId', async (req, res) => {
      const wishlistId = req.params.wishlistId;
    
      const result = await bookCollection.findOneAndUpdate(
        { "wishlist.wishListId": wishlistId },
        { $pull: { wishlist: { wishListId: wishlistId } } }
      );
    
      if (result.value) {
        res.json({ message: 'Wishlist item deleted successfully' });
      } else {
        res.status(404).json({ error: 'Wishlist item not found' });
      }
    });
  } catch(err){
    console.log("error ", err)
  }
};

run().catch((err) => console.log(err));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
