const socket = io("192.168.1.58:8080", {withCredentials: true});

let username = document.getElementById('logThumbLabel').innerHTML.substring(10);
let socket_ID;
let data = sessionStorage.getItem('socketID');

socket.on('connect', () => {
    console.log('connecté au serveur socket.io, data : ' + data);
    if (!data)
        socket_ID = null;//when we connect first time 
    else
        socket_ID = data;//when we connect n times 
    socket.emit('start-session', {  socketID: socket_ID, username: username, inGame: true});
});
socket.on('set-session-aknowledgement', (data) => {
    sessionStorage.setItem('socketID', data.socketID);
    console.log('room crée sur serveur io : ' + data.socketID);
    socket.emit('gameLoaded', data.socketID);
});
socket.on('message', (msg) => {
    if(document.getElementById('webSocketMessage'))
    {
        document.getElementById('webSocketMessage').innerHTML = "";
        document.getElementById('webSocketMessage').innerHTML = "<p>" + msg + "</p>";
        //setTimeout(function(){document.getElementById('webSocketMessage').innerHTML = "";}, 5000);
    }
});
socket.on('setHost', (data) => {
    sessionStorage.setItem('gameHost', data);
})
socket.on('drawCell', (data) => {
    document.getElementById(data.cell).innerHTML = '<p>' + data.token + '</p>';
    document.getElementById(data.cell).firstChild.style.color = 'rgb(0, 0, 0)';
    ////
    // TODO : trouver le moyen de transmettre l'id de la case à partir du paragraphe pour handleCellClick
    ////
});
socket.on('gameResult', (data) => {
    if(data.draw){
        document.getElementById('webSocketMessage').innerHTML = "";
        document.getElementById('webSocketMessage').innerHTML = "<p>match nul !</p>";
    }
    if(data.gagnant){
        document.getElementById('webSocketMessage').innerHTML = "";
        if(data.gagnant == username)
            document.getElementById('webSocketMessage').innerHTML = "<p>Vous Gagnez la partie !</p>";
        else
            document.getElementById('webSocketMessage').innerHTML = "<p>" + data.gagnant + " gagne la partie !</p>";
    }
    let cells = document.getElementsByClassName('cells');
    for(let cell of cells){
        cell.removeEventListener('click', handleCellClick);
    }
    /*
    for(let winCell of data.cells){
        document.getElementById(winCell).style.color = 'green';
    }
    */
    makeCellsBlink(data.cells);
    
    //créer et afficher le bouton reload
    let reloadButton = document.createElement('span');
    reloadButton.setAttribute('id', 'reload');
    reloadButton.setAttribute('data', 'host:' + sessionStorage.getItem('gameHost') + '-from:' + username + '-');
    reloadButton.innerHTML = 'Recommencer';
    reloadButton.style.cursor = 'pointer';
    reloadButton.addEventListener('click', (event) => {
        console.log('target data : ' + event.target.getAttribute('data'));
        let reloadData = event.target.getAttribute('data');
        let reloadHost = reloadData.substring(reloadData.indexOf('host:') + 5, reloadData.indexOf('-', reloadData.indexOf('host:')));
        let reloadFrom = reloadData.substring(reloadData.indexOf('from:') + 5, reloadData.indexOf('-', reloadData.indexOf('from:')));
        socket.emit('gameReload', {host: reloadHost, from:reloadFrom});
    })
    document.getElementById('webSocketMessage').appendChild(reloadButton);
})
socket.on('reloadAsked', (data) => {
    console.log('reload de la partie "' + data.host +  '" demandé par : ' + data.by);
})
socket.on('reloadGame', (data) => {
    let cellElements = document.querySelectorAll('.cells');
    for(let cell of cellElements){
        cell.innerHTML = '';
        cell.addEventListener('click', handleCellClick);
        cell.style.color = '';
    }
    document.getElementById('webSocketMessage').innerHTML = '';
    clearInterval(blink);
})
socket.on('gameLeft', (data) => {
    var cells = document.getElementsByClassName('cells');
    for(cell of cells){
        cell.removeEventListener('click', handleCellClick);
    }
    document.getElementById('webSocketMessage').innerHTML = '';
    document.getElementById('webSocketMessage').innerHTML = data.user + ' a quitté la partie !<br><a href="/" style="cursor: pointer;">Revenir à l\'accueil</a>';
})

// Création du plateau de jeu
function handleCellClick(event){
    ////
    // TODO : récupérer le nom de case quand l'utilisateur clique sur le token d'une case déjà jouée
    ////
    socket.emit('cellPlayed', {gameHost: sessionStorage.getItem('gameHost'), player: socket_ID, cellPlayed: event.target.id})
};

for(let i=1;i<4;i++){
    let col = document.createElement('div');
    col.setAttribute('id', 'col' + i);
    col.setAttribute('class', 'cols');
    document.getElementById('gameContainer').appendChild(col);
    for(let y=1;y<4;y++){
        let cell = document.createElement('div');
        cell.setAttribute('id', 'c' + i + y);
        cell.setAttribute('class', 'cells');
        cell.addEventListener('click', handleCellClick);
        document.getElementById('col' + i).appendChild(cell);
    }
}

// Scintillement des cases gagnantes
let blink;
function makeCellsBlink(cells){
    
    function fadeToGreen(){
        let toGreenInterval = setInterval(() => {
            if(document.getElementById(cells[0]).firstChild.style.color == 'rgb(0, 200, 0)')
                    clearInterval(toGreenInterval);
            for(let cell of cells){
                document.getElementById(cell).firstChild.style.color = document.getElementById(cell).firstChild.style.color.substring(0,7) + (document.getElementById(cell).firstChild.style.color.substring(7, document.getElementById(cell).firstChild.style.color.lastIndexOf(',')) -0 +20) + document.getElementById(cell).firstChild.style.color.substring(document.getElementById(cell).firstChild.style.color.lastIndexOf(','));
            }
        }, 20);
    };
    
    function fadeToBlack(){
        let toBlackInterval = setInterval(() => {
            if(document.getElementById(cells[0]).firstChild.style.color == 'rgb(0, 0, 0)')
                    clearInterval(toBlackInterval);
            for(let cell of cells){
                document.getElementById(cell).firstChild.style.color = document.getElementById(cell).firstChild.style.color.substring(0,7) + (document.getElementById(cell).firstChild.style.color.substring(7, document.getElementById(cell).firstChild.style.color.lastIndexOf(',')) -20) + document.getElementById(cell).firstChild.style.color.substring(document.getElementById(cell).firstChild.style.color.lastIndexOf(','));
            }
        }, 20);
    };
    
    blink = setInterval(() => {
        if(document.getElementById(cells[0]).firstChild.style.color == 'rgb(0, 0, 0)')
            fadeToGreen();
        if(document.getElementById(cells[0]).firstChild.style.color == 'rgb(0, 220, 0)')
            fadeToBlack();
    }, 500);
};