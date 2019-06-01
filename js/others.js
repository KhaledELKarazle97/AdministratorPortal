 var config = {
    apiKey: "AIzaSyDD-nieo0tbWn8zknS7w1TT3WHSlLK7tg8",
    authDomain: "market-9d038.firebaseapp.com",
    databaseURL: "https://market-9d038.firebaseio.com",
    projectId: "market-9d038",
    storageBucket: "market-9d038.appspot.com",
    messagingSenderId: "859739031584"
 };
 firebase.initializeApp(config);
 firebase.storage();




 function openNav() {
   document.getElementById("main-menu").style.width = "250px";   
}
 
 function closeNav() {
   document.getElementById("main-menu").style.width = "0px";
}