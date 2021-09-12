const express = require('express');
require('dotenv').config()

const db = require('./db')

const app = express();

app.use(express.json())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

const port = process.env.PORT || 5000;

// get All restaurants
app.get('/api/v1/restaurants', async (req, res) => {
    try {
        // const response = await db.query('select * from restaurants') 

        const restaurantRatingsData = await db.query('select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) AS average_rating from reviews group by restaurant_id) reviews on restaurants.id =reviews.restaurant_id;')
        res.status(200).json({
            status: 'success',
            length: restaurantRatingsData.rows.length,
            data: {
                restaurants: restaurantRatingsData.rows
            }
        });
    } catch (error) {
        res.status(500).json({
            msg: 'Restaurants Not Found'
        })
    }
});

// get a single restaurants
app.get('/api/v1/restaurants/:id', async (req, res) => {
    try {
        const restaurant = await db.query('select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) AS average_rating from reviews group by restaurant_id) reviews on restaurants.id =reviews.restaurant_id where id = $1;', [req.params.id])
        const review = await db.query('select * from reviews where restaurant_id=$1', [req.params.id])

        res.status(200).json({
            status: 'success',
            data: {
                restaurants: restaurant.rows[0],
                reviews: review.rows
            }
        });
    } catch (error) {
        res.status(500).json({
            msg: 'Restaurants Not Found'
        })
    }
})

// Create A Restaurant
app.post('/api/v1/restaurants', async (req, res) => {
    const { name, location, price_range } = req.body;
    try {
        const response = await db.query('insert into restaurants(name, location, price_range) values ($1, $2, $3) returning *', [name, location, price_range]);
        res.status(201).json({
            status: 'success',
            data: {
                restaurants: response.rows[0]
            }
        })
    } catch (error) {
        res.status(500).json({
            msg: 'Error while creating Restaurants'
        })
    }
})

// Update a restaurants
app.put('/api/v1/restaurants/:id', async (req, res) => {
    const { name, location, price_range } = req.body
    try {
        const response = await db.query('UPDATE restaurants SET name=$1, location=$2, price_range=$3 WHERE id=$4 RETURNING *', [name, location, price_range, req.params.id]);
        res.status(200).json({
            status: 'success',
            data: {
                restaurants: response.rows[0]
            }
        })
    } catch (error) {
        res.status(500).json({
            msg: error.message
        })
    }
})

// Delete a restaurants
app.delete('/api/v1/restaurants/:id', async (req, res) => {
    try {
        const response = await db.query('DELETE from restaurants where id=$1', [req.params.id])
        res.status(204).json({
            status: 'success'
        })
    } catch (error) {
        res.status(500).json({
            msg: error.message
        })
    }
})

// Add Reviews
app.post('/api/v1/restaurants/:id/addReviews', async (req, res) => {
    const { name, rating, review } = req.body;
    try {
        const response = await db.query('INSERT INTO reviews(restaurant_id,name,review, rating) VALUES($1,$2,$3,$4) RETURNING *', [req.params.id, name, review, rating]);

        res.status(201).json({
            status: 'success',
            data: {
                reviews: response.rows[0]
            }
        })

    } catch (err) {
        console.log(err);
    }
})


app.listen(5000, console.log(`server running on Port ${port}`))