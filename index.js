// Import the Express module and create an Express application
var express = require("express");
var app = express();

// Import the MySQL module for database operations
var mysql = require('mysql2');

// Set the view engine to EJS, which allows for dynamic HTML generation
app.set('view engine', 'ejs');

// Import Multer for handling file uploads
const multer = require('multer');

// Import the path module for file path operations
const path = require('path');

// Import Sharp for image processing
const sharp = require('sharp');

// Import the fs module for file system operations
const fs = require('fs');

// Import the body-parser module to parse incoming request bodies
var bodyParser = require("body-parser");
// Configure body-parser to parse URL-encoded data
app.use(bodyParser.urlencoded({extended:true}));

// Serve static files from the specified directories
app.use(express.static("views"));
app.use(express.static("images"));
app.use(express.static("style"));

// Configure the MySQL database connection
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    port: '3306',
    password: '1234',
    database: 'phones'
});

// Connect to the MySQL database
db.connect((err) =>{
    if(err){
        console.log("go back and check the connection details. Something is wrong.")
    } else{
        console.log('Looking good the database connected')
    }
});

// Configure Multer for file uploads, specifying the destination and filename
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize Multer with the specified storage configuration
var upload = multer({ storage: storage });

// Serve static files from the uploads and resized directories
app.use(express.static("uploads"));


// Define a route for the home page, fetching data from the 'device' table
app.get('/', function(req,res){
    let sql = 'SELECT * FROM device';
    let query = db.query(sql, (err,result) => {
        if(err) throw err;
        console.log(result);
        res.render('home', {result})   
    });
});

// Define a route for adding a new device, rendering the 'add' view
app.get('/add', function(req,res){
    res.render('add')
});

// Define a route for posting a new device, handling file upload and database insertion
app.post('/add',upload.single("image"), async function(req,res){
    // Resize the uploaded image using Sharp
    const { filename: image } = req.file;      
    await sharp(req.file.path)
        .resize(500, 500)
        .jpeg({ quality: 90 })
        .toFile(
            path.resolve(req.file.destination,'resized',image)
        );

    // Insert the new device into the 'device' table
    let sql = 'insert into device (brand, price, model, image, descriptions) values (?, ?, ?, ?, ?)';
    let query = db.query(sql,[req.body.brand, req.body.price, req.body.model, req.file.filename, req.body.descriptions], (err,result) => {
        if(err) throw err;
        console.log(result);
        res.redirect( '/')   
    });    
});

// Define a route for fetching devices by brand, rendering the 'brand' view
app.get('/brand/:brand', function(req,res){
    let sql = 'SELECT * FROM device WHERE brand = ?';
    let query = db.query(sql, [req.params.brand],( err,result) => {
        if(err) throw err;
        console.log(result);
        res.render('brand', {result})   
    });
});

// Define a route for fetching a specific device by ID, rendering the 'product' view
app.get('/Product/:id', function(req,res){
    let sql = 'SELECT * FROM device WHERE id = ?';
    let query = db.query(sql, [req.params.id],( err,result) => {
        if(err) throw err;
        console.log(result);
        res.render('product', {result})   
    });
});

// Define a route for handling image resizing, redirecting to the home page
app.post('/resized', upload.single("image"), async function(req, res){
    const { filename: image } = req.file;      
    await sharp(req.file.path)
        .resize(500, 500)
        .jpeg({ quality: 90 })
        .toFile(
            path.resolve(req.file.destination,'resized',image)
        );
    res.redirect('/');
});

// Start the Express server
app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0" , function(){
 console.log("New Full Demo is Live")
});
