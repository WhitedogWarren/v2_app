const express = require('express');
const app = express();
const util = require('util');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const http = require('http');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");

//gestion des connexion bdd
const dbclient = new MongoClient('mongodb://localhost:27017/mydb', { useUnifiedTopology: true });
let _dbConnexion = null;
dbclient.connect(function(err, dbConnexion){
    console.log("Connected successfully to db from app.js");
    assert.equal(null, err);
    _dbConnexion = dbConnexion;
})
app.use(function(req, res, next) {
    res.locals.dbConnexion = _dbConnexion;
    next();
});


mongoose.connect('mongodb://localhost:27017/mydb', {useNewUrlParser: true, useUnifiedTopology: true});
let _mongooseDBconnexion = null;
var mongooseDBconnexion = mongoose.connection;
mongooseDBconnexion.on('error', console.error.bind(console, 'mongoose connection error : '));
mongooseDBconnexion.once('open', function() {
    console.log('connected to mongooseDB from app.js');
    _mongooseDBconnexion = mongooseDBconnexion;
});
app.use(function(req, res, next) {
    res.locals.mongooseDBconnexion = _mongooseDBconnexion;
    next();
});

//modules persos
const sessionsManage = require('./handmade_modules/sessionsManage.js');
const morpionManager = require('./handmade_modules/morpion-server.js');

//Création des sessions
////
// TODO : vérifier les options pour éviter les problèmes de perte de session chez le client malgré persistence côté serveur
////
const httpSession = session({
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/mydb' }),
    secret: 'keepItSecret',
    resave: true,
    saveUninitialized: false,
    unset: 'destroy',
    cookie: { secure: false, maxAge: 600000 }
});
app.use(httpSession);

//Création serveur socket.io
const wsServer = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(wsServer, {
    cors: {
        origin: true,  //ports 8080 et 3000? tous les ports du localhost?
        methods: ["GET", "POST"],
        allowedHeaders: 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
        credentials: true
    }
});
wsServer.listen(8080, () => {
    console.log('serveur webSocket créé sur port 8080');
});


//création des routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const logRouter = require('./routes/log');
const morpionRouter = require('./routes/morpion');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//tiré du cours openclassrooms sur node, express, mongo
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


//gestion des connections socket.io
io.on('connection', (socket) => {
    console.log('a user connected');
    //setTimeout(function(){socket.emit('message', 'Le serveur vous dis bonjour!');}, 500);
    //setTimeout(function(){socket.emit('message', 'Le serveur vous demande si vous allez bien.');}, 5000);
    socket.on('start-session', (data) => {
        if(data.socketID === null)
        {
            socket.username = data.username;
            socket.join(data.username);
            if(socket.rooms.has(data.username))
            {
                socket.emit("set-session-aknowledgement", { socketID: data.username});
                sessionsManage.findSessions(_dbConnexion).then((value) => {
                    socket.broadcast.emit('newConnection', {newOne: socket.username, userList: value});
                });
            }
        }
        else
        {
            socket.username = data.username;
            socket.join(data.username);
            if(socket.rooms.has(data.username))
            {
                sessionsManage.findSessions(_dbConnexion).then((value) => {
                    socket.emit("set-session-aknowledgement", { socketID: data.socketID, userList: value});
                });
            }
            if(data.inGame == false){ // L'utilisateur vient-il de quitter un jeu en cours ?
                morpionManager.games.forEach((value, key, map) => {
                    if(value.player1 == socket.username){
                        console.log(socket.username + ' a abandonné un jeu.');
                        io.to(value.player2).emit('gameLeft', {user: socket.username});
                    }
                    if(value.player2 == socket.username){
                        console.log(socket.username + ' a abandonné un jeu.');
                        io.to(value.player1).emit('gameLeft', {user: socket.username});
                    }
                })
            }
        }
    });
    
    socket.on("disconnect", (reason) => {
        if(socket.username)
            console.log(socket.username + ' disconnected : ' + reason);
        setTimeout(function(){sessionsManage.findSessions(_dbConnexion).then((value) => {
            
            //L'utilisateur a-t-il quitté une partie en cours
            function checkGames(value, key, map){
                if(value.player1 === socket.username){
                    console.log(socket.username + ' a abandonné un jeu.');
                    io.to(value.player2).emit('gameLeft', {user: socket.username});
                }
                if(value.player2 === socket.username){
                    console.log(socket.username + ' a abandonné un jeu.');
                    io.to(value.player1).emit('gameLeft', {user: socket.username});
                }
            }
            //Déconnection
            if(value.users.indexOf(socket.username)<0)
            {
                io.emit('userLeft', {goneOne: socket.username, userList: value});
                morpionManager.games.forEach(checkGames);
            }
            //Fermeture de fenêtre sans déconnection
            else if(!io.to(socket.username).adapter.rooms.has(socket.username)){
                console.log(socket.username + ' a quitté le site ( sans se déconnecter)');
                morpionManager.games.forEach(checkGames);
                ////
                // TODO enlever le nom de l'utilisateur de la userList
                ////
                //io.emit('userLeft', {goneOne: socket.username, userList: value});
            }
        })}, 2000);
    });
    socket.on("invite", async (data) => {
        io.to(data.guest).emit('message', data.host + " vous a invité!");
        
        const [hostSessionId, guestSessionId] = await Promise.all([
            sessionsManage.findUserSessionId(_dbConnexion, data.host),
            sessionsManage.findUserSessionId(_dbConnexion, data.guest)
        ])
        
        await Promise.all([
            sessionsManage.addHostInvite(_dbConnexion, hostSessionId, data.guest),
            sessionsManage.addGuestInvite(_dbConnexion, guestSessionId, data.host)
        ])
        
        const userList = await sessionsManage.findSessions(_dbConnexion);
        io.to(data.host).emit('updateUserList', {userList: userList});
        io.to(data.guest).emit('updateUserList', {userList: userList});
        
    });
    socket.on("openGame", (data) => {
        console.log("Commencer une partie\nHôte : " + data.host + "\nInvité : " + data.guest);
        ////
        // TODO : comprendre pourquoi data.host vaut parfois "null"
        ////
        
        // intégrer l'invité dans la room de l'hôte
        for(let client of io.sockets.sockets){
            if(client[1].username == data.guest)
                client[1].join(data.host);
        }
        
        for(client of io.sockets.sockets){
            if(client[1].username == data.host)
                console.log('room "' + data.host + '" : ' + util.inspect(client[1].rooms));
        }
        // Lancer une partie entre les deux joueurs
        //redirige les joueurs
        io.to(data.host).emit('gameStarted', {guest: data.guest});
        io.to(data.guest).emit('gameStarted', {host: data.host});
        //créé l'instance MorpionGame
        morpionManager.games.set(data.host, new morpionManager.MorpionGame(data.host, data.guest));
        // supprimer les hostInvites et guestInvites
        sessionsManage.findUserSessionId(_dbConnexion, data.host).then((sessionId) => {
            sessionsManage.removeHostInvite(_dbConnexion, sessionId, data.guest);
        });
        sessionsManage.findUserSessionId(_dbConnexion, data.guest).then((sessionId) => {
            sessionsManage.removeGuestInvite(_dbConnexion, sessionId, data.host);
        });
    });
    //page de jeu chargée par un joueur
    socket.on('gameLoaded', (data) => {
        let gameHost;    
        if(morpionManager.games.has(data)){
            console.log(morpionManager.games.get(data));
            gameHost = data;
        }
        else{
            console.log('Pas de jeu au nom de ' + data);
            morpionManager.games.forEach(function(value, key, map){
                if(value.player2 === data){
                    socket.join(value.player1);
                    io.to(value.player1).emit("message", 'Message émis par room ' + value.player1);
                    gameHost = value.player1;
                }
            });
        }
        io.to(data).emit('setHost', gameHost);
    });
    socket.on('cellPlayed', (data) => { // jouer le coup
        io.to(data.gameHost).emit('message', data.player + ' joue en ' + data.cellPlayed);
        let returnOfPlay = morpionManager.games.get(data.gameHost).play(data.player, data.cellPlayed);
        if(returnOfPlay.error)
            console.log('returnOfPlay Error :' + returnOfPlay.error);
        else{
            console.log('Réponse : ' + returnOfPlay.message);
            io.to(data.gameHost).emit('drawCell', {token: returnOfPlay.token, cell: returnOfPlay.cellToDraw, turn: morpionManager.games.get(data.gameHost).turn});
            if(returnOfPlay.result){
                console.log('result.draw : ' + returnOfPlay.result.draw + '\nresult.gagnant : ' + returnOfPlay.result.gagnant + '\nCases : ' + returnOfPlay.result.cells);
                io.to(data.gameHost).emit('gameResult', returnOfPlay.result);
            }
        }
    });
    socket.on('gameReload', (data) => {
        console.log('reload ' + data.host + " from : " + data.from);
        let otherPlayer
        let askingPlayer
        if(data.host == data.from){
            otherPlayer = 'player2';
            askingPlayer = 'player1';
        }
        else{
            otherPlayer = 'player1';
            askingPlayer = 'player2';
        }
        if(morpionManager.games.get(data.host).reload.get(otherPlayer)){ //relancer le jeu
            let reloadGuest = morpionManager.games.get(data.host).player2;
            morpionManager.games.set(data.host, new morpionManager.MorpionGame(data.host, reloadGuest));
            io.to(data.host).emit('reloadGame', {host: data.host, guest: morpionManager.games.get(data.host).player2});
        }
        else{ //enregistrer la demande de reload et prévenir les joueurs
            morpionManager.games.get(data.host).reload.set(askingPlayer, true);
            io.to(data.host).emit('reloadAsked', {host: data.host, by: data.from});
        }
    })
    
    socket.on('gameLeave', (data) => {
        console.log('game left ! ' + data.user + ' quitte la partie de ' + data.gameHost);
    })
});


//Gestion des routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.post('/log', logRouter);
app.use('/log', logRouter);
app.use('/morpion', morpionRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;