var express = require('express');
var router = express.Router();
var util = require('util');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const dbclient = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });


/* GET home page. */
router.get('/', function(req, res, next) {
    var renderObject = { title: 'Multi_V2'};
    
    if(req.session.user)
    {
        console.log('session trouvée : ' + req.session.user);
        renderObject.user = req.session.user;
        
        //TODO : récupérer la liste des utilisateurs connectés
        var foundSessions = [];
        
        dbclient.connect(function(err) {
            assert.equal(null, err);
            console.log("Connected successfully to server");
            const db = dbclient.db('mydb');
            const collection = db.collection('sessions');
            // Find some documents
            collection.find({}).toArray(function(err, docs) {
            assert.equal(err, null);
            for(i=0; i<docs.length; i++)
            {
                foundSessions.push(JSON.parse(docs[i].session).user);
            }
            console.log('l33: ' + foundSessions);
            renderObject.sessions = foundSessions;
            });
            
        });
        
    }
    else
    {
        console.log('session non trouvée');
    }
    console.log('l44, sessions: ' + renderObject.sessions);
    res.render('index', renderObject);
});

module.exports = router;