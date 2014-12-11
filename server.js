// HTTP Portion
var http = require('http');
var fs = require('fs'); // Using the filesystem module
var url = require("url");

// var connect = require('connect'); //*

var Twit = require('twit');
var T = new Twit({
  consumer_key:         'j07JZXulfN11WR9nY2uUQg', 
  consumer_secret:      'uXZpEUdjNp9JdzIJvwnJAG6rwptCsVUqcUTxOAgQw',
  access_token:         '94977134-Rr9YLk9IJ05o7ZvPTu77vUjLsj01YqOqzD4Y32dTd',
  access_token_secret:  'v7jNsYSzKXrZJL5ptoUgGupF4g7XJAHxpxFc4zMNS4cux'
});

var httpServer = http.createServer(requestHandler);
httpServer.listen(8080);

// WebSocket Portion
// WebSockets work with the HTTP server
// var app = connect().use(connect.static(__dirname)); //*
var io = require('socket.io').listen(httpServer);

function requestHandler(req, res) {
	var path = url.parse(req.url).pathname;
	console.log('path is ' + path);
	// if home page, show index.html
	if(path == "/"){
		fs.readFile(__dirname + '/index.html', 
			// Callback function for reading
			function (err, data) {
				// if there is an error
				if (err) {
					res.writeHead(500);
					return res.end('Error loading index.html');
				}
				// Otherwise, send the data, the contents of the file
				res.writeHead(200);
				res.end(data);
	  		}
	  	);
   }

   if(req.url.indexOf('.js') != -1){
   		console.log(__dirname + path);
   		fs.readFile(__dirname + path, function(err,data){
   			if(err) console.log(err);
   			res.writeHead(200, {'Content-Type': 'text/javascript'});
   			res.write(data);
   			res.end();
   		});
   }

   // if getTwitterData, get the twitter data, respond back through sockets
   else if(path == "/tweets"){
	  console.log('in twitter data');

	  // get the search query
	  var query = url.parse(req.url).query;
	  console.log("the serach is " + query);

	  // Execute a Twitter API call
	  T.get('statuses/user_timeline', { screen_name: query, count: 20 }, function(err, data, response) {

	    var tweets = data;

	    allT(tweets);
	    // tweets is an array of twitter objects
	    // to access the tweet text
	    for(var i=0;i<tweets.length;i++){
	    	// search each text for a word match
	    	// console.log(tweets[i].text);
	    	if(i == 0){
	    		emitSocket('NYC!');

	    	}
	    	// when you find a match, call emitSocket(match)
	    }

 		function allT(t){
	    	console.log(' sending twitts');

	    	io.sockets.emit('tweets', t);
	    }

	    // step 2
	    function emitSocket(match){
	    	console.log('matching word is ' + match);

	    	io.sockets.emit('wordMatch', match);
	    }
	  
		res.writeHead(200);
		res.end();
	  }); 
   }
   else {
   	// send them somewhere else like a 404 page or the index page
   	console.log('404 error !!!!');
   }
}

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function
	function (socket) {
	
		console.log("We have a new client: " + socket.id);
	
		// When this user "send" from clientside javascript, we get a "message"
		// client side: socket.send("the message");  or socket.emit('message', "the message");
		socket.on('message', 
			// Run this function when a message is sent
			function (data) {
				console.log("message: " + data);
				
				// Call "broadcast" to send it to all clients (except sender), this is equal to
				// socket.broadcast.emit('message', data);
				socket.broadcast.send(data);
				
				// To all clients, on io.sockets instead
				// io.sockets.emit('message', "this goes to everyone");
			}
		);
		
		// When this user emits, client side: socket.emit('otherevent',some data);
		socket.on('sendingImage', function(data) {
			// Data comes in as whatever was sent, including objects
			console.log(" server getting image ");
			io.sockets.emit('whatever_2', 'https://playwhatcovers.s3.amazonaws.com/537ce53c31596a0b002e786a.png');
		});
		
		


		socket.on('disconnect', function() {
			console.log("Client has disconnected");
		});
	}
);


