let logForm = document.getElementById('logForm')
let logNameElement = document.getElementById('logName');
let logPassElement = document.getElementById('logPass');

let registerForm = document.getElementById('registerForm');
let registerNameElement = document.getElementById('registerName');
let registerPassElement = document.getElementById('registerpass');

////
//prévalidation des formulaires
////

//formulaire de connexion
logForm.addEventListener('submit', event => {
    event.preventDefault();
    if(checkLogInputs()){
        logForm.submit();
    }
    else{
        document.body.style.backgroundImage = 'url("../images/logger_claire2_red.png")';
    }
});

logNameElement.addEventListener('input', event => {
    checkLogName();
});

logPassElement.addEventListener('input', event => {
    checkLogPass();
});

function checkLogInputs(){
    let response = true;
    if(!checkLogName()){
        response = false;
    }
    if(!checkLogPass()){
        response = false;
    }
    return response;
}

function checkLogName(){
    if(logNameElement.value == ''){
        logNameElement.classList.add('not-valid');
        return false;
    }
    else{
        logNameElement.classList.remove('not-valid');
        return true;
    }
}

function checkLogPass(){
    if(logPassElement.value == ''){
        logPassElement.classList.add('not-valid');
        return false;
    }
    else{
        logPassElement.classList.remove('not-valid');
        return true;
    }
}


//formulaire d'enregistrement
registerForm.addEventListener('submit', event => {
    event.preventDefault();
    if(checkRegisterInputs()){
        //console.log('Validé');
        registerForm.submit();
    }
    else{
        document.body.style.backgroundImage = 'url("../images/logger_claire2_red.png")';
    }
});

registerNameElement.addEventListener('change', event => {
    checkRegisterName();
});

registerPassElement.addEventListener('change', event => {
    checkRegisterPass();
});

registerNameElement.addEventListener('input', event => {
    warnRegisterName(event.target.value);
});

registerPassElement.addEventListener('input', event => {
    warnRegisterPass(event.target.value);
});

function checkRegisterInputs(){
    let response = true;
    if(!checkRegisterName()){
        response = false;
    }
    if(!checkRegisterPass()){
        response = false;
    }
    return response;
}

function checkRegisterName(){
    if(registerNameElement.value.length < 3 || registerNameElement.value.length > 20){
        registerNameElement.classList.add('not-valid');
        return false;
    }
    else{
        registerNameElement.classList.remove('not-valid');
        return true;
    }
}

function checkRegisterPass(){
    if(registerPassElement.value == ''){
        registerPassElement.classList.add('not-valid');
        return false;
    }
    else{
        registerPassElement.classList.remove('not-valid');
        return true;
    }
}

function warnRegisterName(name){
    document.getElementById('testMessage').innerHTML = '';
    if(name.length < 3 ){
        document.getElementById('testMessage').innerHTML = '';
        document.getElementById('testMessage').innerHTML = 'Pseudo trop court';
    }
    if(name.length > 20){
        document.getElementById('testMessage').innerHTML = '';
        document.getElementById('testMessage').innerHTML = 'Pseudo trop long';
    }
    
}

function warnRegisterPass(pass){
    document.getElementById('testMessage').innerHTML = '';
    if(pass.length < 6){
        document.getElementById('testMessage').innerHTML = '';
        document.getElementById('testMessage').innerHTML = 'Mot de passe trop court'; 
    }
    if(pass.length > 20){
        document.getElementById('testMessage').innerHTML = '';
        document.getElementById('testMessage').innerHTML = 'Mot de passe trop long';
    }
}


//Gestion de l'image de fond
if(document.getElementById('logThumbLabel')) {
    document.body.style.backgroundImage = 'url("../images/logger_claire2_green.png")';
}
if(document.getElementById('logError')) {
    document.body.style.backgroundImage = 'url("../images/logger_claire2_red.png")';
}