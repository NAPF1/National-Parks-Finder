const express = require("express");
const app = express();
const fetch = require("node-fetch");
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session')
const pool = dbConnection();
const saltRounds = 10;
const recKey = "16e25615-c6fd-45e6-a029-6b372d46c8aa"; // recAPI Key
const axios = require("axios"); // NEED THIS FOR NPS GOV API


app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'secret code',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))
app.set("view engine", "ejs");
app.use(express.static("public"));
//to parse Form data sent using POST method
app.use(express.urlencoded({extended: true}));




// Login
app.get('/', (req, res) => {
  res.render('login');
});

// LOGIN POST
app.post('/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  //let plainTextPwd = "s3cr3t";
  let passwordHash = "";

  let sql = `SELECT * 
              FROM users
              WHERE username = ?`;
  let rows = await executeSQL(sql, [username]);
  if (rows.length > 0) { //username exists in database
    passwordHash = rows[0].password;
  }
  const match = await bcrypt.compare(password, passwordHash);
  
  if (match) {
    req.session.authenticated = true;
    req.session.username = username;
    res.redirect('welcome');
  } else {
    res.render('login', {"error":"Wrong credentials"})
  }
});

// Welcome
app.get('/welcome', isAuthenticated, async (req, res) => {
	let options = {
  	method: 'GET',
  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
		params: {limit: '500'},
  	headers: {
	    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
	    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
	    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
	  }
	}; // End of options header

	let data = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
  res.render('welcome', {"parks":data});
});

// Signup
app.get('/signup', (req, res) => {
  res.render('signup');
});

// SIGNUP POST
app.post('/signup', async (req, res) => {
	let fName = req.body.fName;
	let lName = req.body.lName;
	let state = req.body.state;
  let username = req.body.username;
  let password = req.body.password;
  let sex = req.body.sex;
	
  console.log(fName, lName, state, username, password, sex);

	password = await bcrypt.hash(password, saltRounds);

  let sql = `INSERT INTO users
              (firstName, lastName, state, username, password, sex)
              VALUES
              (?,?,?,?,?,?)`

  let params = [fName,lName,state,username,password,sex];
  executeSQL(sql, params);
	res.redirect('/');
});

// Profile
app.get('/profile', isAuthenticated, async(req, res) => {
  let username = req.session.username;
  let sql = `SELECT * 
              FROM users
              WHERE username = ?`;
	let params = [username];
  let data = await executeSQL(sql,params);
	
	let userId = data[0].userId;
	sql = `SELECT * 
              FROM wishlist
              WHERE userId = ?`;
	params = [userId];
  let list = await executeSQL(sql,params);

	sql = `SELECT * 
              FROM reviews
              WHERE userId = ?`;
  let reviews = await executeSQL(sql,params);
	
  res.render('profile', {"user":data, "list":list, "reviews":reviews});
});

// UPDATE PROFILE POST
app.post('/updateProfile', async (req, res) => {
	let current = req.session.username;
	console.log("Current: " + current);
	let sql = `SELECT userId
						 FROM users
						 WHERE username = ?`;
	let params = [current];
	let users = await executeSQL(sql, params);
	let userId = users[0].userId;
	console.log("USER ID: " + userId);

	let fName = req.body.fName;
	let lName = req.body.lName;
	let state = req.body.state;
  let username = req.body.username;
  let password = req.body.password;
  let sex = req.body.sex;
  console.log(fName, lName, state, username, password, sex);
	
	password = await bcrypt.hash(password, saltRounds);
	
  sql = `UPDATE users
				 SET
					firstName = ?,
					lastName = ?,
					state = ?,
					username = ?,
					password = ?,
					sex = ?
				 WHERE
					userId = ?`;
  params = [fName,lName,state,username,password,sex,userId];
  executeSQL(sql, params);
  req.session.username = username;
	res.redirect('/welcome');
});

// Search Parks
app.get('/searchParks', isAuthenticated, async (req, res) => {
	let options = {
  	method: 'GET',
  	url: 'https://ridb.recreation.gov/api/v1/activities',
		params: {limit: '30'},
  	headers: {
	    apikey: recKey
	  }
	}; // End of options header

	let data = await axios.request(options).then(function (response) {
													return response.data.RECDATA;
												}).catch(function (error) {
													console.error(error);
												});
  res.render('searchParks', {"acts":data});
});

// Parks
app.get('/parks', isAuthenticated, async (req, res) => {
	let state = req.query.state;
	let act = req.query.activity;
	let keyword = req.query.keyword;
	console.log(state + " " + act + " " + keyword);

	if (state != undefined) {
		let options = {
	  	method: 'GET',
	  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
			params: {limit: 400, stateCode: `${state}`},
	  	headers: {
		    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
		    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
		    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
		  }
		}; // End of options header
		let data = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
	console.log(data);
  res.render('parks', {"parks":data});
	}
	else if (act != undefined) {
		let options = {
	  	method: 'GET',
	  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
			params: {limit: 400, q: `${act}`},
	  	headers: {
		    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
		    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
		    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
		  }
		}; // End of options header
		let data = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
  res.render('parks', {"parks":data});
	}
	else {
		let options = {
	  	method: 'GET',
	  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
			params: {limit: 400, q: `${keyword}`},
	  	headers: {
		    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
		    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
		    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
		  }
		}; // End of options header
		let data = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
	console.log(data);
  res.render('parks', {"parks":data});
	}
});

// About Park
app.get('/about', isAuthenticated, async(req, res) => {
  let username = req.session.username;
  let sql = `SELECT * 
              FROM users
              WHERE username = ?`;
	let params = [username];
  let user = await executeSQL(sql,params);

	let parkCode = req.query.park;

	let options = {
	  	method: 'GET',
	  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
			params: {parkCode: `${parkCode}`},
	  	headers: {
		    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
		    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
		    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
		  }
		}; // End of options header
	let park = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
  sql = `SELECT * 
              FROM reviews
              WHERE parkCode = ?`;
	params = [parkCode];
  review = await executeSQL(sql,params);	
  res.render('about', {"user":user, "park":park, "reviews":review});
});

// Study before Quiz
app.get('/study', isAuthenticated, async(req, res) => {
	let options = {
	  	method: 'GET',
	  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
			params: {parkCode: `zion`},
	  	headers: {
		    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
		    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
		    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
		  }
		}; // End of options header
	let park = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
  res.render('study', {"park":park});
});

// Quiz 
app.get('/quiz', isAuthenticated, async(req, res) => {
	let options = {
	  	method: 'GET',
	  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
			params: {parkCode: `zion`},
	  	headers: {
		    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
		    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
		    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
		  }
		}; // End of options header
	let park = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
  res.render('quiz', {"park":park});
});

// Review
app.get('/review', isAuthenticated, async(req, res) => {
	let username = req.session.username;
  let sql = `SELECT * 
              FROM users
              WHERE username = ?`;
	let params = [username];
  let user = await executeSQL(sql,params);

	let parkCode = req.query.parkCode;
	console.log(parkCode); // THIS WORKS IN CONSOLE

	let options = {
	  	method: 'GET',
	  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
			params: {parkCode: `${parkCode}`},
	  	headers: {
		    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
		    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
		    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
		  }
		}; // End of options header
	let park = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
  res.render('review', {"user":user, "park":park});
});

// REVIEW POST
app.post('/review', async (req, res) => {
	let username = req.body.username;
	let userId = req.body.userId;
	let rating = req.body.rating;
	let review = req.body.review;
	let parkName = req.body.parkName;
	let parkCode = req.body.parkCode;
	
  sql = `INSERT INTO reviews
					(username, rating, review, userId, parkCode, parkName)	
					VALUES
					(?,?,?,?,?,?)`;

  params = [username, rating, review, userId, parkCode, parkName];
  executeSQL(sql, params);
	res.redirect('welcome');
});

// WISHLIST POST
app.post('/wishlist', async (req, res) => {
	let current = req.session.username;
	let sql = `SELECT userId
						 FROM users
						 WHERE username = ?`;
	let params = [current];
	let users = await executeSQL(sql, params);
	let userId = users[0].userId;
	let parkCode = req.body.parkCode;

	let options = {
  	method: 'GET',
  	url: 'https://jonahtaylor-national-park-service-v1.p.rapidapi.com/parks',
		params: {parkCode: `${parkCode}`},
  	headers: {
	    'X-Api-Key': 'y7Hm57IVcTIgrWfteFYbsre6hzDNhhaRklAG1dY4',
	    'X-RapidAPI-Host': 'jonahtaylor-national-park-service-v1.p.rapidapi.com',
	    'X-RapidAPI-Key': 'b54c78f2d3msh666eab2fd4dc4f0p111358jsn1e9228e87ff6'
	  }
	}; // End of options header
	let park = await axios.request(options).then(function (response) {
													return response.data.data;
												}).catch(function (error) {
													console.error(error);
												});
	let parkName = park[0].fullName;	

	let s = `SELECT *
            FROM wishlist
            WHERE parkCode = ? AND userId = ?`;
  let p = [parkCode, userId];
  let rows = await executeSQL(s, p);
  console.log(rows);

  if (Object.keys(rows).length == 0){
    sql = `INSERT INTO wishlist
					(parkName, parkCode, userId)	
					VALUES
					(?,?,?)`;
	  params = [parkName, parkCode, userId];
	  executeSQL(sql, params);
		console.log("Added " + parkName + "(" + parkCode + ")" + " to " + current + "'s list!");
	}
	res.redirect('profile');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(); // Logs out
  res.redirect('/'); // Redirects to homepage for login
});




app.get("/dbTest", async function(req, res){
let sql = "SELECT CURDATE()";
let rows = await executeSQL(sql);
res.send(rows);
});//dbTest

//functions
async function executeSQL(sql, params){
return new Promise (function (resolve, reject) {
pool.query(sql, params, function (err, rows, fields) {
if (err) throw err;
   resolve(rows);
});
});
}//executeSQL

//middleware function
function isAuthenticated(req, res, next){
  if (req.session.authenticated) {
     next();
   } else {
      res.render('login')
   }
}
//app level middleware
app.use(function (req, res, next){
    console.log("Accessed at: " + Date.now());
     next();
});

//values in red must be updated
function dbConnection(){

   const pool  = mysql.createPool({

      connectionLimit: 10,
      host: "lyn7gfxo996yjjco.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
      user: "o191v6lwz5qwmfuw",
      password:process.env['dbpwd'],
      database: "ztss8b6trq0cebgc"
   }); 

   return pool;

} //dbConnection

//start server
app.listen(3000, () => {
console.log("Expresss server running...")
} )