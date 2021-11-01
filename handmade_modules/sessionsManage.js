const assert = require('assert');
const util = require('util');

var confirmLoading = function(res)
{
    console.log('sessionsManage chargé');
}

var findSessions = function (dbConnexion){
    var collection = dbConnexion.db('mydb').collection('sessions');
    return new Promise((resolve, reject) => {
        var founSessionsObject = {users: [], hostInvites: [], guestInvites: []};
        collection.find({}).toArray(function(err, docs) {
            assert.equal(err, null);
            for(i=0; i<docs.length; i++)
            {
                founSessionsObject.users[i] = JSON.parse(docs[i].session).user;
                if(JSON.parse(docs[i].session).hostInvites)
                    founSessionsObject.hostInvites[i] = JSON.parse(docs[i].session).hostInvites;
                else
                    founSessionsObject.hostInvites[i] = false;
                if(JSON.parse(docs[i].session).guestInvites)
                    founSessionsObject.guestInvites[i] = JSON.parse(docs[i].session).guestInvites;
                else
                    founSessionsObject.guestInvites[i] = false;
            }
            resolve(founSessionsObject);
        });
    });
}

var findUserSessionId = function(dbConnexion, user){
    var userSessionsCollection = dbConnexion.db('mydb').collection('sessions');
    return new Promise((resolve, reject) => {
        var userDocId;
        userSessionsCollection.find({}).toArray(function(err, docs) {
            for(i=0;i<docs.length;i++)
            {
                var sessionObj = JSON.parse(docs[i].session);
                if(sessionObj.user == user)
                {
                    userDocId = docs[i]._id;
                }
            }
            resolve(userDocId);
        });
    });
}

var addHostInvite = function(dbConnexion, docId, guest){
    return new Promise((resolve, reject) => {
        var userDoc = dbConnexion.db('mydb').collection('sessions').find({_id: docId});
        userDoc.forEach((doc) => {
            var hostSessionObject = JSON.parse(doc.session);
            if(!hostSessionObject.hostInvites)
                hostSessionObject.hostInvites = [guest];
            else
            {
                if(hostSessionObject.hostInvites.indexOf(guest)>-1)
                    console.log('invitation déjà envoyée!');
                else
                    hostSessionObject.hostInvites.push(guest);
            }
            var hostSessionString = JSON.stringify(hostSessionObject);
            dbConnexion.db('mydb').collection('sessions').updateOne({_id: docId}, { $set: {session: hostSessionString}});
        },
        () => {
            console.log('ajout de l\'hostInvite terminé');
            resolve();
        }
        );//fin forEach
    });//fin new promise
};//fin function

var addGuestInvite = function(dbConnexion, docId, host){
    return new Promise((resolve, reject) => {
        var userDoc = dbConnexion.db('mydb').collection('sessions').find({_id: docId});
        userDoc.forEach((doc) => {
            var guestSessionObject = JSON.parse(doc.session);
            if(!guestSessionObject.guestInvites)
                guestSessionObject.guestInvites = [host];
            else
            {
                if(guestSessionObject.guestInvites.indexOf(guest)>-1)
                    console.log('invitation déjà reçue!');
                else
                    guestSessionObject.guestInvites.push(host);
            }
            var guestSessionString = JSON.stringify(guestSessionObject);
            dbConnexion.db('mydb').collection('sessions').updateOne({_id: docId}, { $set: {session: guestSessionString}});
        },
        () => {
            console.log('ajout de la guestInvite terminé');
            resolve();
        }
        );
    });
};

var removeHostInvite = function(dbConnexion, docId, guest){
    var userDoc = dbConnexion.db('mydb').collection('sessions').find({_id: docId});
    userDoc.forEach((doc) => {
        var hostSessionObject = JSON.parse(doc.session);
        if(hostSessionObject.hostInvites.indexOf(guest) > -1){
            if(hostSessionObject.hostInvites.length == 1)
                delete hostSessionObject.hostInvites
            else
                hostSessionObject.hostInvites.splice(hostSessionObject.hostInvites.indexOf(guest), 1);
        }
        var hostSessionString = JSON.stringify(hostSessionObject);
        dbConnexion.db('mydb').collection('sessions').updateOne({_id: docId}, { $set: {session: hostSessionString}});
    },
    () => {console.log('suppression de l\'hostInvite terminée');}
    );
    
}

var removeGuestInvite = function(dbConnexion, docId, host){
    var userDoc = dbConnexion.db('mydb').collection('sessions').find({_id: docId});
    userDoc.forEach((doc) => {
        var guestSessionObject = JSON.parse(doc.session);
        if(guestSessionObject.guestInvites.indexOf(host) > -1){
            if(guestSessionObject.guestInvites.length == 1)
                delete guestSessionObject.guestInvites;
            else   
                guestSessionObject.guestInvites.splice(guestSessionObject.guestInvites.indexOf(host), 1);
            
        }
        var guestSessiontring = JSON.stringify(guestSessionObject);
        dbConnexion.db('mydb').collection('sessions').updateOne({_id: docId}, { $set: {session: guestSessiontring}});
    },
    () => {console.log('suppression de la guestInvite terminée');}
    );
}

module.exports = {
    confirmLoading: confirmLoading,
    findSessions: findSessions,
    findUserSessionId: findUserSessionId,
    addHostInvite: addHostInvite,
    addGuestInvite: addGuestInvite,
    removeHostInvite: removeHostInvite,
    removeGuestInvite: removeGuestInvite
}