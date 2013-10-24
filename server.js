var static = require('node-static');
var http = require('http');
var file = new(static.Server)({cache :0});

var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(2013);


var io = require('socket.io').listen(app);


var rooms = [];
var roomSocket = [2];
roomSocket[0] = [];
roomSocket[1] = [];
var socketClients = {};

io.sockets.on('connection', function (socket){

	var socketId = socket.id;

	// function log(){
	// 	var array = [">>> "];
	//   for (var i = 0; i < arguments.length; i++) {
	//   	array.push(arguments[i]);
	//   }
	//     socket.emit('log', array);
	// }

	socket.on('text',function (text, room){
		// log('Server has got text: ',text);
		if (roomSocket[0][room]) {
			socketClients[roomSocket[0][room]].emit('text', text);
			if (roomSocket[1][room]) {
				socketClients[roomSocket[1][room]].emit('text', text);
			}
		} 
	});
	
	socket.on('message', function (message, room) {
		// log('Got message: ', message);
		// log('Room name: ', room);
		if (roomSocket[0][room]) {
			socketClients[roomSocket[0][room]].emit('message', message);
			if (roomSocket[1][room]) {
				socketClients[roomSocket[1][room]].emit('message', message);
			}
		} // should be room only
	});

	socket.on('create or join', function (room) {
		var numClients = io.sockets.clients(room).length;
		var createOrJoin = true;//true for creat and false for join.

		// log('Room ' + room + ' has ' + numClients + ' client(s)');
		// log('Request to create or join room', room);

		for (var i in rooms) {
			if(rooms[i] == room){
				createOrJoin = false;
			}
		}

		if (numClients == 0 || createOrJoin){
			socket.join(room);
			rooms.push(room);
			socket.emit('created', room);
			roomSocket[0][room]=socket.id;
			socketClients[socket.id] = socket;
		} else if (numClients == 1 && !createOrJoin) {
			io.sockets.in(room).emit('join', room);
			// socket.emit('join',room);
			socket.join(room);
			socket.emit('joined', room);
			socketClients[socket.id] = socket;
			roomSocket[1][room]=socket.id;
		} else { // max two clients
			socket.emit('full', room);
		}
		socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
		socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

	});

});

