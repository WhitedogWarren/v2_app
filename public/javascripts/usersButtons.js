function inviteUser(username)
{
    console.log("user ivité : " + event.target.innerHTML);
    console.log(socket);
    socket.emit('invite', {host: sessionStorage.getItem('socketID'), guest: username});
}

if(document.getElementById('loggedUsers'))
{
    var userButtons = document.getElementsByClassName('userButtons');
    for(i=0;i<userButtons.length;i++)
    {
        userButtons[i].addEventListener('click', () => {console.log(event.target.innerHTML);});
    }
}