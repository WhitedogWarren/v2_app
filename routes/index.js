const express = require('express');
const router = express.Router();
const util = require('util');
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const dbclient = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });

const sessionsManage = require('../handmade_modules/sessionsManage.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    var renderObject = { title: 'Multi_V2'};
    sessionsManage.confirmLoading(res);
    if(req.session.user)
    {
        //sessionsManage.confirmLoading();
        console.log('session trouvée : ' + req.session.user);
        renderObject.user = req.session.user;
        
        //// La section ci-dessous pose probablement problème : doublon avec la gestion websocket.
        
        renderObject.sessions = sessionsManage.findSessions(res.locals.dbConnexion).then((value) => {
            //console.log("l22 : " + value);
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