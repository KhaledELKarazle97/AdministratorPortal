const express = require('express');
const app = express();
const path = require('path');
const functions = require('firebase-functions');
var compression = require('compression');
var admin = require("firebase-admin");
var helmet = require("helmet");

var serviceAccount = require("./market-9d038-firebase-adminsdk-5h555-754846aefd");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://market-9d038.firebaseio.com"
});

var db = admin.database();

app.use(helmet());
app.use(compression());

app.disable('x-powered-by');

app.post('/authUser', (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    idToken = req.body.token;
    admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            var uid = decodedToken.uid;
            var admins = db.ref('admins/' + uid);

            admins.once('value',snapshot=>{
                if (snapshot.val() === null) {
                    res.sendStatus(401)
                } else {
                    res.sendStatus(200)

                }
            });
        
            return 0;
        }).catch((error) => {
            res.send(error)
        });
});

app.post('/authUserPassword', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    admin.auth().getUserByEmail(req.body.email)
    .then((userRecord) => {
      var admins = db.ref('admins/' + userRecord.uid + '/email');
     admins.once('value',snapshot=>{
         if(snapshot.val()!== null){
        res.sendStatus(200);
        return 0;
         }else{
             res.sendStatus(401);
         }
         return 0;
     });
     return 0;
    })
    .catch((error) => {
        res.sendStatus(500);
    });
});


app.get('/getTotalCat', (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    var cats = db.ref("categories/");
    cats.once("value", (snapshot) => {
        res.write(snapshot.numChildren().toString(), () => {
            res.end()
        });
    }, (errorObject) => {
        res.send(errorObject);
    });

});

app.get('/getTotalUsers', (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    var countUsers = 0;

    function listAllUsers(nextPageToken) {
        // List batch of users, 1000 at a time.
        admin.auth().listUsers(1000, nextPageToken)
            .then((listUsersResult) => {
                listUsersResult.users.forEach((userRecord) => {
                    countUsers++;
                    return 0;
                });
                res.write(countUsers.toString(), () => {
                    res.end()
                });
                return 0;
            })
            .catch((error) => {
                //  res.send(error);
            });
    }
    listAllUsers();

});

app.get('/getTotalPosts', (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    var posts = db.ref("posts/");
    posts.once("value", (snapshot) => {
        res.write(snapshot.numChildren().toString(), () => {
            res.end()
        });
    }, (errorObject) => {});

});

app.get('/getTotalReports', (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    var reports = db.ref("reports/");
    reports.once("value", (snapshot) => {
        res.write(snapshot.numChildren().toString(), () => {
            res.end()
        });
    }, (errorObject) => {});

});

app.get('/getAllUsers', (req, res) => {

    var data = [];

    function listAllUsers(nextPageToken) {
        admin.auth().listUsers(1000, nextPageToken)
            .then((listUsersResult) => {
                listUsersResult.users.forEach((userRecord) => {
                    data.push(userRecord);
                    return 0;
                });
                res.write(JSON.stringify(data), () => {
                    res.end()
                });
                return 0;
            })
            .catch((error) => {});
    }
    listAllUsers();
});

app.post('/Delete', (req, res) => {

    var uid = req.body.id;
    var users = db.ref("users/" + uid);

    users.remove()
        .then(() => {
            return 0;
        }).catch((error) => {
            res.send(error);
        });
    admin.auth().deleteUser(uid)
        .then(() => {
            res.send('Successfully deleted user');
            return 0;
        })
        .catch((error) => {
            res.send(error);
        });
});


app.post('/Freeze', (req, res) => {
    var uid = req.body.id;
    admin.auth().updateUser(uid, {
        disabled: true
    })
});

app.post('/Unfreeze', (req, res) => {
    var uid = req.body.id;
    admin.auth().updateUser(uid, {
        disabled: false
    })
});


app.get('/allCats', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    var cats = db.ref("categories/");
    cats.once("value", (snapshot) => {
        res.write(JSON.stringify(snapshot.val()));
        res.end();
    }, (errorObject) => {
        res.send(errorObject.code);
    });
});

app.post('/searchUser', (req, res) => {
    var userID = req.body.id;
    var users = db.ref("users/");
    res.setHeader('Content-Type', 'application/json');

    users.child(userID).once('value', (snapshot) => {
        snapshot.forEach((child) => {
            res.write(JSON.stringify(snapshot));
            res.end();
        });
    });
});



app.post('/updateProfile', (req, res) => {

    var uid = req.body.uid;
    var users = db.ref("users/" + uid);
    var name = req.body.name;
    var location = req.body.location;
    var area = req.body.area;
    var phoneNumber = req.body.phoneNumber;
    var gender = req.body.gender;
    var birthday = req.body.birthday;
    if (!isNaN(phoneNumber)) {
        users.update({
            name: name,
            gender: gender,
            location: location,
            phoneNumber: phoneNumber,
            birthday: birthday,
            area: area
        })
        res.sendStatus(200);
    } else {
        res.status(406).send('Something went wrong, check your inputs and resubmit');
    }

});



app.post(('/getOwner'), (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    var owner = req.body.owner;
    admin.auth().getUser(owner)
        .then((userRecord) => {
            res.send(userRecord);
            return 0;
        })
        .catch((error) => {
            res.write('Error fetching user data:', error, (er) => {
                res.end()
            });
        });

});

app.post(('/getAd'), (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    var id = req.body.id;
    var posts = db.ref("posts/" + id);
    res.setHeader('Content-Type', 'application/json');
    posts.once("value", (snapshot) => {
        res.write(JSON.stringify(snapshot));
        res.end();
        return 0;
    }, (errorObject) => {
        res.send(errorObject);
    });
});

app.get(('/getOtherDetails'), (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    var posts = db.ref("posts/");

    posts.once("value")
        .then(snapshot => {
            res.write(JSON.stringify(snapshot));
            res.end();
            return 0;
        }).catch(err => {
            console.log(err);
        })

});

app.post(('/getUserStatus'), (req, res) => {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    var id = req.body.id;
    admin.auth().getUser(id)
        .then((userRecord) => {
            res.send(userRecord);
            return 0;
        })
        .catch((error) => {
            res.write('Error fetching user data:', error, (er) => {
                res.end()
            });
        });

});

app.post(('/sendMsg'), (req, res) => {
    var ref = db.ref("messages/");
    var msgRef = ref.child("/");
    var to = req.body.to;
    var from = req.body.from;
    var msg = req.body.msg;

    let current_datetime = new Date()
    let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds() 

    msgRef.push().set({
        message: msg,
        sender: from,
        reciever: to,
        status: 'unread',
	    timeStamp: formatted_date
    });
    res.sendStatus(200);
    return 0;

});

app.post('/register', (req, res) => {
    var email = req.body.email;
    var adminPass = req.body.adminPass;
    var repeatPass = req.body.repeatPass;
    if (adminPass === repeatPass) {
        admin.auth().createUser({
                email: email,
                emailVerified: true,
                password: adminPass,
                disabled: false
            })
            .then(userRecord => {
                var ref = db.ref('admins');
                ref.child(userRecord.uid).set({
                    email: email 
                });
                return 0;
            })
            .catch(error => {
                console.log('Error creating new user:', error);
            });
            res.sendStatus(200);
            return 0;
    } else {
        res.sendStatus(500);
        return 0;
    }
});
exports.app = functions.https.onRequest(app);