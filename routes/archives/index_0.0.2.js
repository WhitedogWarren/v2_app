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
        
        function findSessions()
        {
            return new Promise((resolve, reject) => {
                
                dbclient.connect(function(err) {
                    var founSessionsArray = new Array();
                    assert.equal(null, err);
                    console.log("Connected successfully to server");
                    const db = dbclient.db('mydb');
                    const collection = db.collection('sessions');
                    // Find some documents
                    collection.find({}).toArray(function(err, docs) {
                        assert.equal(err, null);
                        for(i=0; i<docs.length; i++)
                        {
                            founSessionsArray[i] = JSON.parse(docs[i].session).user;
                        }
                        console.log("l35 : " + founSessionsArray);
                        resolve(founSessionsArray);
                        
                    });
                });
            });
        }
        
        renderObject.sessions = findSessions().then((value) => {
            console.log("l60 : " + value);
            renderObject.sessions = value;
            res.render('index', renderObject);
        });
        
    }
    else
    {
        console.log('session non trouvée');
        res.render('index', renderObject);
    }
});

module.exports = router;