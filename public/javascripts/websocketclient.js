const socket = io("192.168.1.58:8080", {withCredentials: true});

function updateUserList(userList)
{
    if(document.getElementById("loggedUsers")){
        document.getElementById("loggedUsers").innerHTML = "";
        if(userList.users.length > 1){
            for(i=0;i<userList.users.length;i++){
                var hosts = [];
                var guests = [];
                if(userList.users[i] != username)
                {
                    var userSpan = document.createElement("span");
                    userSpan.setAttribute('class', 'userButtons');
                    userSpan.setAttribute('name', userList.users[i]);
                    var spanContent = userList.users[i];
                    //récupérer les hostInvites et guestInvites
                    if(userList.guestInvites[i])
                    {
                        if(userList.guestInvites[i].indexOf(username)>-1)
                        spanContent += " <img src='./images/sablier.gif' alt='sablier'/>";
                        userSpan.addEventListener('click', () => {
                            document.getElementById('webSocketMessage').innerHTML = "";
                            document.getElementById('webSocketMessage').innerHTML = "<p>Vous avez déjà invité" + userList.users[i] + "</p>";
                            setTimeout(function(){document.getElementById('webSocketMessage').innerHTML = "";}, 4000);
                        });
                    }
                    if(userList.hostInvites[i])
                    {
                        if(userList.hostInvites[i].indexOf(username)>-1)
                            spanContent += "<img src='./images/coucou.gif' alt='coucou' name='" + userList.users[i] + "'/>";
                    
                        userSpan.addEventListener('click', (event) => {
                            console.log("hôte : " + event.target.getAttribute('name') + "\nInvité : " + username);
                            socket.emit('openGame', {host: event.target.getAttribute('name'), guest: username});
                        })
                    }
                    if(!userList.guestInvites[i] && !userList.hostInvites[i])
                        userSpan.addEventListener('click', (event) => {inviteUser(event.target.getAttribute('name'));})
                    userSpan.innerHTML = spanContent;
                    document.getElementById("loggedUsers").appendChild(userSpan);
                    if(i+1 != userList.users.length)
                        document.getElementById("loggedUsers").appendChild(document.createElement("br"));
                }
            }
        }
        else
        document.getElementById("loggedUsers").innerHTML = '<span>Aucun</span>' 
    }
}

function inviteUser(username)
{
    console.log("user ivité : " + username);
    socket.emit('invite', {host: sessionStorage.getItem('socketID'), guest: username});
}


if(document.getElementById('logThumbLabel')) //élément qui n'existe que si l'utilisateur est connecté
{
    //créer une room perso ou rejoindre sa room
    var username = document.getElementById('logThumbLabel').innerHTML.substring(10);
    var socket_ID;
    var data = sessionStorage.getItem('socketID');
            
    socket.on('connect', () => {
        console.log('connecté au serveur socket.io, data : ' + data);
        if (!data)
            socket_ID = null;//when we connect first time 
        else
             socket_ID = data;//when we connect n times 
        socket.emit('start-session', {  socketID: socket_ID, username: username, inGame: false});
    });
    socket.on('set-session-aknowledgement', (data) => {
        sessionStorage.setItem('socketID', data.socketID);
        console.log('room crée sur serveur io : ' + data.socketID);
        if(document.getElementById("loggedUsers"))
        {
            document.getElementById("loggedUsers").innerHTML = "";
            updateUserList(data.userList);
        }
    });
    
    //gestion des évènements socket.io
    socket.on('message', function(msg) {
        if(document.getElementById('webSocketMessage'))
        {
            document.getElementById('webSocketMessage').innerHTML = "";
            document.getElementById('webSocketMessage').innerHTML = "<p>" + msg + "</p>";
            setTimeout(function(){document.getElementById('webSocketMessage').innerHTML = "";}, 4000);
        }
    });
    socket.on('newConnection', function(data) {
        if(document.getElementById('webSocketMessage'))
        {
            document.getElementById('webSocketMessage').innerHTML = "<p>" + data.newOne + " vient de se connecter</p>";
            setTimeout(function(){document.getElementById('webSocketMessage').innerHTML = "";}, 5000);
        }
        if(document.getElementById("loggedUsers"))
        {
            document.getElementById("loggedUsers").innerHTML = "";
            updateUserList(data.userList);
        }
    });
    socket.on('userLeft', function(data) {
        if(document.getElementById('webSocketMessage'))
        {
            document.getElementById('webSocketMessage').innerHTML = "<p>" + data.goneOne + " s'est déconnecté<p>";
            setTimeout(function(){document.getElementById('webSocketMessage').innerHTML = "";}, 5000);
        }
        if(document.getElementById("loggedUsers"))
        {
            document.getElementById("loggedUsers").innerHTML = "";
            updateUserList(data.userList);
        }
    });
    socket.on('updateUserList', (data) => {
        updateUserList(data.userList);
    });
    socket.on('gameStarted', (data) => {
        window.location.href = "/morpion";
    });
    
}
else //utilisateur non connecté ou session perdue
{
    sessionStorage.removeItem('socketID');
    socket.disconnect();
    document.getElementById("loggedUsers").innerHTML = "Vous n'êtes pas connecté";
}