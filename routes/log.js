var express = require('express');
var router = express.Router();
var util = require('util');
var mongoose = require("mongoose");

/* GET log page. */
router.get('/', function(req, res, next) {
  var renderObject = { title: 'Multi_v2 logger', page: 'logger'};
    if(req.session.user)
    {
        renderObject.user = req.session.user;
        console.log('session trouvée : ' + req.session.user);    
    }
    else
            console.log('session non trouvée');
    res.render('logpage', renderObject);
});

const userSchema = new mongoose.Schema({
        pseudo: { type : String, required : true },
        password: { type : String, required : true }
});
const User = mongoose.model('user', userSchema);

/*POST log page */
router.post('/', function(req, res, next) {
    let renderObject = { title: 'Multi_v2 logger', page: 'logger'};
    let postedFields = Object.getOwnPropertyNames(req.body);
    if(postedFields.includes('postedName') && postedFields.includes('postedPass')){ // Formulmaire de connexion posté
        if(!req.body.postedName && !req.body.postedPass){
            console.log('Formulaire vide ( nouvelle approche');
            renderObject.logError = "Veuillez remplir le formulaire";
            res.render('logpage', renderObject);
        }
        if(!req.body.postedName){
            console.log('Pseudo non renseigné ( nouvelle approche )');
            renderObject.logError = "nom d'utilisateur requis";
            res.render('logpage', renderObject);
        }
        if(!req.body.postedPass) {
            renderObject.logError = 'mot de passe requis';
            res.render('logpage', renderObject);
            console.log('Mot de passe non renseigné ( nouvelle approche )');
        }
        ////
        // formulaire correectement rempli
        ////
        if(req.session.user) //il existe déjà une session.
        {
            ////
            //  TODO : gérer le problème de session perdue côté client
            ////
            renderObject.logError = 'Vous êtes déjà connecté. Veuillez vous déconnecter si vous souhaiter changer d\'utilisateur';
            res.render('logpage', renderObject);
        }
        var query = User.find({pseudo: req.body.postedName});
        var promiseQuery = query.exec();
        promiseQuery.then(function(resultat) {
            if(resultat < 1)
            {
                renderObject.logError = 'ce nom d\'utilisateur n\'est pas enregistré. Utilisez le formulaire de droite pour créer un nouveau compte utilisateur';
                res.render('logpage', renderObject);
            }
            else
            {
                if(req.body.postedPass !== resultat[0].password)
                {
                    renderObject.logError = 'Mot de passe incorrect!';
                    res.render('logpage', renderObject);
                }
                else
                {
                    req.session.user = req.body.postedName;
                    req.session.save();
                    renderObject.user = req.session.user;
                    res.render('logpage', renderObject);
                }
            }
        })
    }
    
    if(postedFields.includes('postedNewName') && postedFields.includes('postedNewPass')) { //Formulaire d'inscription posté
        if(!req.body.postedNewName && !req.body.postedNewPass){
            renderObject.logError = "Veuillez remplir le forumulaire !";
            res.render('logpage', renderObject);
        }
        if(!req.body.postedNewName){
            renderObject.logError = "Veuillez saisir un nom d''utilisateur";
            res.render('logpage', renderObject);
        }
        if(!req.body.postedNewPass){
            renderObject.logError = "Veuillez saisir un mot de passe";
            res.render('logpage', renderObject);
        }
        ////
        // Formulaire accepté
        ////
        if(req.session.user)
        {
            renderObject.logError = 'Vous êtes déjà connecté. Veuillez vous déconnecter avant de créer un nouveau compte utilisateur';
            res.render('logpage', renderObject);
        }
        var postedNewName = req.body.postedNewName;
        var query = User.find({pseudo: postedNewName});
        var promiseQuery = query.exec();
        promiseQuery.then(function(resultat) {
            //Vérifier l'inexistence du nom d'utilisateur demandé
            if(resultat.length < 1)
            {
                User.create({pseudo: req.body.postedNewName, password: req.body.postedNewPass});
                renderObject.logMessage = 'Votre compte a bien été créé. Bienvenue.'
                req.session.user = req.body.postedNewName;
                renderObject.user = req.session.user;
            }
            else
                renderObject.logError = 'ce nom d\'utilisateur est déjà pris';
            res.render('logpage', renderObject);
        })
    }
    else
    console.log("Requête invalide !!");

    if(req.body.unsetAsked)
    {
        req.session.destroy(); //y a-t-il un callback pour y mettre le res.render ?
        res.render('logpage', renderObject);
    }
});

module.exports = router;