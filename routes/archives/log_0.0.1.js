var express = require('express');
var router = express.Router();
var util = require('util');
var mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/mydb', {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error : '));
db.once('open', function(){console.log('connected to db')});

const userSchema = new mongoose.Schema({
    pseudo: { type : String, required : true },
    password: { type : String, required : true }
});

const User = mongoose.model('user', userSchema);

/* GET log page. */
router.get('/', function(req, res, next) {
  var renderObject = { title: 'mySite logger'};
    if(req.session.user)
    {
        renderObject.user = req.session.user;
        console.log('session trouvée : ' + req.session.user);    
    }
    else
    {
        console.log('session non trouvée');
    }
    res.render('logpage', renderObject);
});
    
/*POST log page */
router.post('/', function(req, res, next) {
  var renderObject = { title: 'mySite logger'};
    
    if(!req.body.postedName || !req.body.postedPass)
        console.log('il manque des éléments');
    
    if(req.body.postedName && req.body.postedPass)
    {
        console.log('posted : name="' + req.body.postedName + '", pass="' + req.body.postedPass + '"');
        if(req.session.user)
        {
            renderObject.logError = 'alreadyConnected';
            console.log('already connected');
        }
        else
        {
            //TODO : verifier l'existence de l'utilisateur et la validité du mot de passe
            
            req.session.user = req.body.postedName;
            renderObject.user = req.session.user;
            console.log(req.session.user + " id: " + req.session.id);
        }
    }
    
    if(req.body.postedNewName && req.body.postedNewPass)
    {
        if(req.session.user)
        {
            renderObject.logError = 'alreadyConnected';
            console.log('already connected');
        }
        else
        {
            var postedNewName = req.body.postedNewName;
            var queryResult = new User({pseudo: postedNewName});
            console.log(queryResult);
            //TODO : Vérifier l'inexistence du nom d'utilisateur demandé
            /*User.find({pseudo: req.body.postedNewName}, function(err, users){
                if(err) return console.error(err);
                
                
                
                if(users.length < 1)
                User.create({pseudo: req.body.postedNewName, password: req.body.postedNewPass});
                else
                {
                    // TODO : transmettre l'erreur au renderObject
                    //return 'user already exists';
                    //console.log('l80: ' + util.inspect(renderObject));
                   queryResult = 'user already exist';
                   return; 
                }
                
            });*/
            
            
        }
        
    }
    
    if(req.body.unsetAsked)
    {
        req.session.destroy();
    }
    
    console.log('l94: ' + queryResult);
    res.render('logpage', renderObject);
});

module.exports = router;