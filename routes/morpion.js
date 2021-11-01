const express = require('express');
const router = express.Router();
const util = require('util');
const assert = require('assert');

router.get('/', function(req, res, next) {
    var renderObject = { title: 'Morpion V2'};
    
    if(req.session.user)
    {
        console.log('session trouvée : ' + req.session.user);
        renderObject.user = req.session.user;
    }
    else
    {
        console.log('session non trouvée');
    }
    res.render('morpion', renderObject);
});

module.exports = router;