const path = require('path');
const morgan = require('morgan');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Settings
app.set('port', 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
// app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../node_modules')));
app.use(express.static(path.join(__dirname, 'assets')));


// Importing Routes
const indexRoutes = require('./routes/routes.js');
app.use('/', indexRoutes.router);

// Starting the Web server
server.listen(app.get('port'), async function() {
    console.log(`Server started on port ${app.get('port')}`);
    indexRoutes.socket_io(io);
})
