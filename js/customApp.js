/*global angular*/
var app = angular.module('customApp', ['firebase', 'ngRoute']);
var database = firebase.database();
var ref = firebase.database().ref();


app.config(function($routeProvider) {
    $routeProvider
        .when("/dashboard", {
            templateUrl: "views/dashboard.html"
        })
        .when("/reports", {
            templateUrl: "views/reports.html"
        })
        .when("/showReport/:buyerEmail/:reportedEmail/:reportedPost/:reportmsg", {
            templateUrl: "views/showReport.html"
        })
        .when("/ads", {
            templateUrl: "views/ads.html"
        })
        .when("/showAd", {
            templateUrl: "views/showAd.html"
        })
        .when("/users", {
            templateUrl: "views/users.html"
        })
        .when("/showUser/:uid/:email", {
            templateUrl: "views/showUser.html"
        })
        .otherwise({
            redirectTo: "/dashboard"
        });
});

app.factory("Auth", ["$firebaseAuth",
    function($firebaseAuth) {
        "use strict";
        return $firebaseAuth();
    }
]);


app.directive('headerFile', function() {
    return {
        restrict: 'E',
        templateUrl: '/Header/Header.html'
    };
});

app.controller("adminCtrl", ['$scope', '$http', '$location', 'firebase', '$firebaseObject', 'Auth', '$firebaseArray', function($scope, $http, $location, firebase, $firebaseObject, Auth, $firebaseArray) {
    "use strict";
    // AUTH
    $scope.signin = {};
    $scope.signin.state = false;

    $scope.signInWithEmailAndPassword = function(email, password) {
        Auth.$signInWithEmailAndPassword(email, password).then(function(firebaseuser) {}).catch(function(error) {
            alert(error);
        });

    };

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            user.getIdToken().then(function(data) {
                $http({
                        method: 'POST',
                        url: '/authUser',
                        data: {
                            token: data
                        }
                    })
                    .then(function(response) {
                        $scope.signin.state = true;
                        console.log(response.data);

                    }, function(error) {
                        $scope.signin.state = false;
                        alert(error.data);
                    });
            }).catch(function(error) {});

        } else {
            $scope.signin.state = false;
        }

    });

    $scope.signout = function() {
        Auth.$signOut();
        $scope.signin.state = false;
    };

    $scope.getpwrd = function(adminEmail) {
        var auth = firebase.auth();
        $http({
                method: 'POST',
                url: '/authUserPassword',
                data: {
                    email: adminEmail
                }
            })
            .then(function(response) {
               auth.sendPasswordResetEmail(adminEmail).then(function() {
                    alert("Instructions sent via email, please check your inbox");
                }).catch(function(error) {
                    alert(error);
                });

            }, function(error) {
                alert(error.data);
            });
    }
}]);

app.controller("dashboardCtrl", ['$scope', '$http', 'firebase', '$firebaseObject', 'Auth', '$firebaseArray', function($scope, $http, firebase, $firebaseObject, Auth, $firebaseArray) {
    "use strict";
    $http({
            method: 'GET',
            url: '/getTotalCat'

        })
        .then(function(response) {
            $scope.totalCategories = response.data;
        }, function(error) {
            console.log(error);
        });

    $http({
            method: 'GET',
            url: '/getTotalUsers'

        })
        .then(function(response) {
            $scope.totalUsers = response.data;
        }, function(error) {
            console.log(error);
        });

    $http({
            method: 'GET',
            url: '/getTotalPosts'

        })
        .then(function(response) {
            $scope.totalAds = response.data;
        }, function(error) {
            console.log(error);
        });

    $http({
            method: 'GET',
            url: '/getTotalReports'

        })
        .then(function(response) {
            $scope.totalReports = response.data;
        }, function(error) {
            console.log(error);
        });
    var get_categories = $firebaseArray(ref.child('categories/'));
    var get_posts = firebase.database().ref('posts/');
    get_categories.$loaded()
        .then(function() {
            var postedItems = [];
            var counts = {};
            $scope.final = [];

            get_posts.once("value", function(snapshot) {

                for (let i = 0; i < Object.values(snapshot.val()).length; i++) {
                    postedItems.push(Object.values(snapshot.val())[i].postCategory);
                }

                for (let i = 0; i < postedItems.length; i++) {
                    counts[postedItems[i]] = 1 + (counts[postedItems[i]] || 0);
                }


                for (let i = 0; i < Object.keys(counts).length; i++) {
                    $scope.final.push({
                        name: Object.keys(counts)[i],
                        y: Object.values(counts)[i]
                    })
                }

                $http({
                        method: 'GET',
                        url: '/allCats'

                    })
                    .then(function(response) {
                        $scope.cateArray = [];
                        for (var i = 0; i < Object.values(response.data).length; i++) {
                            $scope.cateArray.push(Object.values(response.data)[i]);
                        }
                    }, function(error) {
                        console.log(error);
                    });

                Highcharts.chart('container', {
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie'
                    },
                    title: {
                        text: "Post's Category"
                    },
                    tooltip: {
                        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                style: {
                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                }
                            }
                        }
                    },

                    series: [{
                        name: 'Posts with this category',
                        colorByPoint: true,
                        data: $scope.final
                    }]
                });

            });

        });
}]);



app.controller("reportsCtrl", ['$scope', '$routeParams', '$http', 'firebase', '$firebaseObject', 'Auth', '$firebaseArray', '$location', function($scope, $routeParams, $http, firebase, $firebaseObject, Auth, $firebaseArray, $location) {
    "use strict";
    $scope.reports = $firebaseArray(ref.child('reports/'));
    $scope.showReport = function(id) {
        $scope.indexValue = $scope.reports.findIndex(reports => reports.$id === id);
        sessionStorage.setItem("getReportID", $scope.reports[$scope.indexValue].$id);
    }
}]);

app.controller("ViewReportsCtrl", ['$scope', '$routeParams', '$http', 'firebase', '$firebaseObject', 'Auth', '$firebaseArray', '$location', function($scope, $routeParams, $http, firebase, $firebaseObject, Auth, $firebaseArray, $location) {
    "use strict";
    $scope.reports = $firebaseArray(ref.child('reports/'));

    $scope.userEmail = $routeParams.buyerEmail;
    $scope.reportedEmail = $routeParams.reportedEmail;
    $scope.reportedProdut = $routeParams.reportedPost;
    $scope.reportmsg = $routeParams.reportmsg;


    $scope.reportID = sessionStorage.getItem("getReportID");

    $scope.deletepost = function() {
        var manageReports = firebase.database().ref('reports/' + $scope.reportID);
        bootbox.confirm({
            title: "<h3 id='warning-title'>Warning</h3>",
            message: "<div id='warning-delete'><h5>You are about to delete this report,once deleted, you will not be able to retrieve it back, proceed?</h5></div>",
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-info'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-danger'
                }
            },
            callback: function(result) {
                if (result == true) {
                    manageReports.remove();
                    window.location.href = '#!reports'
                }

            }
        });
    };

}]);

app.controller("allAdsCtrl", ['$scope', '$http', 'firebase', '$firebaseObject', 'Auth', '$firebaseArray', '$location', function($scope, $http, firebase, $firebaseObject, Auth, $firebaseArray, $location) {
    "use strict";
    $scope.posts = $firebaseArray(ref.child('posts/'));

    $scope.showAd = function(id) {
        $scope.indexValue = $scope.posts.findIndex(posts => posts.$id === id);
        sessionStorage.setItem("adID", $scope.posts[$scope.indexValue].$id); 
    }

    document.getElementById('searchAds').addEventListener("keyup", searchFunction);

    function searchFunction() {
        var input, filter, table, tr, td, i, txtValue;
        input = document.getElementById("searchAds");
        filter = input.value.toUpperCase();
        table = document.getElementById("adsTable");
        tr = table.getElementsByTagName("tr");

        for (i = 0; i < tr.length; i++) {
            td = tr[i].getElementsByTagName("td")[0];
            if (td) {
                txtValue = td.textContent || td.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                } else {
                    tr[i].style.display = "none";
                }
            }
        }
    }
}]);


app.controller("adsCtrl", ['$scope', '$http', 'firebase', '$firebaseObject', 'Auth', '$firebaseArray', '$location', function($scope, $http, firebase, $firebaseObject, Auth, $firebaseArray, $location) {
    "use strict";
    $scope.owner = sessionStorage.getItem("owner");
    $scope.ID = sessionStorage.getItem("adID");

    $http({
            method: "POST",
            url: "/getAd",
            data: {
                id: $scope.ID
            }
        })
        .then(function(res) {
            $scope.postName = res.data.postName
            $scope.postCategory = res.data.postCategory
            $scope.region = res.data.region
            $scope.area = res.data.area
            $scope.breed = res.data.breed
            $scope.age = res.data.age
            $scope.weight = res.data.weight
            $scope.status = res.data.status
            $scope.description = res.data.description
            $scope.images = res.data.images
            $scope.timeStamp = res.data.dateTime;

            $scope.postDate = new Date($scope.timeStamp);
            $scope.now = new Date();
            $scope.diff = Math.abs($scope.now.getTime() - $scope.postDate.getTime());
            $scope.diffDay = Math.ceil($scope.diff / (1000 * 60 * 60 * 24));

            if ($scope.diffDay > 30) {
                $scope.warning = "WARNING: This Post have been in the system for more than 30 days, please advise the seller or remove the post.";
            } else {
                $scope.warning = "";
            }

            $http({
                method: 'POST',
                url: '/getOwner',
                data: {
                    owner: res.data.uid
                }
            }).then(function(res) {
                $scope.postOwner = res.data.email
                $scope.uid = res.data.uid;
            }).catch(function(error) {
                console.log(error);
            });
        })
        .catch(function(err) {
            console.log(err);
        });

    $scope.deleteAd = function() {
        var manageads = firebase.database().ref('posts/' + $scope.ID);
        bootbox.confirm({
            title: "<h3 id='warning-title'>Warning</h3>",
            message: "<div id='warning-delete'><h5>You are about to delete this ad,once deleted, you will not be able to retrieve it back, proceed?</h5></div>",
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-info'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-danger'
                }
            },
            callback: function(result) {
                if (result == true) {
                    manageads.remove();
                    window.location.href = '#!ads'
                }

            }
        });
    };
}]);

app.controller("allUsersCtrl", ['$scope', '$http', 'firebase', '$firebaseObject', 'Auth', '$firebaseArray', '$location', function($scope, $http, firebase, $firebaseObject, Auth, $firebaseArray, $location) {
    "use strict";
    $http({
            method: 'GET',
            url: '/getAllUsers'
        })
        .then(function(response) {
            $scope.users = response.data;
        });
    $scope.currentUser = firebase.auth().currentUser.email;
    $scope.manageUser = function(command, userID) {
        bootbox.confirm({
            title: "<h3 id='warning-title'>Warning</h3>",
            message: "<div id='warning-delete'><h5>You are about to " + command + " this account, do you wish to continue?</h5></div>",
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-info'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-danger'
                }
            },
            callback: function(result) {
                if (result == true) {
                    $http({
                            method: 'POST',
                            url: '/' + command,
                            data: {
                                id: userID
                            }
                        })
                        .then(function(response) {});
                    location.reload();
                }

            }
        });
    }

    document.getElementById('searchUsers').addEventListener("keyup", searchFunction);

    function searchFunction() {
        var input, filter, table, tr, td, i, txtValue;
        input = document.getElementById("searchUsers");
        filter = input.value.toUpperCase();
        table = document.getElementById("usersTable");
        tr = table.getElementsByTagName("tr");

        for (i = 0; i < tr.length; i++) {
            td = tr[i].getElementsByTagName("td")[0];
            if (td) {
                txtValue = td.textContent || td.innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                } else {
                    tr[i].style.display = "none";
                }
            }
        }
    }
    $scope.signpUp = function(adminEmail, adminPass, repeatPass) {
        if (adminPass.length < 9) {
            alert("Password must be more than 9 characters")
        } else if (adminPass != repeatPass) {
            alert("Make sure both passwords match");
        } else {

            $http({
                method: "POST",
                url: "/register",
                data: {
                    email: adminEmail,
                    adminPass: adminPass,
                    repeatPass: repeatPass
                }
            }).then(function(res) {
                    alert("Administrator Account Created Successfully!");
                    $scope.adminEmail = "";
                    $scope.adminPass = "";
                    $scope.repeatPass = ""
                    
            }).catch(function(error){
                alert(error.data);
            })

        }
    }
}]);

app.controller("userCtrl", ['$scope', '$routeParams', '$http', 'firebase', '$firebaseObject', 'Auth', '$firebaseArray', '$location', function($scope, $routeParams, $http, firebase, $firebaseObject, Auth, $firebaseArray, $location) {
    "use strict";
    $scope.countProds = 0;
    $scope.admin = "Administrator";
    $scope.user = $routeParams.email;
    $http({
            method: "POST",
            url: '/searchUser',
            data: {
                id: $routeParams.uid
            }
        })
        .then(function(res) {
            $scope.email = $routeParams.email;
            $scope.name = res.data.name;
            $scope.location = res.data.location;
            $scope.area = res.data.area;
            $scope.phoneNumber = res.data.phoneNumber;
            $scope.birthday = new Date(res.data.birthday);
            $scope.url = res.data.url;
            $scope.gender = res.data.gender;
            if ($scope.gender === "Male") {
                document.getElementById('male').setAttribute('selected', 'selected')
            } else {
                document.getElementById('female').setAttribute('selected', 'selected')
            }
        });

    $http({
        method: "POST",
        url: '/getUserStatus',
        data: {
            id: $routeParams.uid
        }

    }).then(function(res) {
        if (res.data.emailVerified == true) {
            $scope.verified = "Verified"
        } else {
            $scope.verified = "Not Verified"
        };

    });


    $http({
        method: "GET",
        url: "/getOtherDetails"
    }).then(function(res) {
        for (var i in Object.values(res.data)) {
            if (Object.values(res.data)[i].uid === $routeParams.uid) {
                $scope.countProds++;
            }
        }
    });



    $scope.updateProfile = function() {
        var e = document.getElementById("gender");
        $scope.gender = e.options[e.selectedIndex].value;

        $http({
                method: "POST",
                url: "/updateProfile",
                data: {
                    uid: $routeParams.uid,
                    name: $scope.name,
                    location: $scope.location,
                    area: $scope.area,
                    phoneNumber: $scope.phoneNumber,
                    gender: $scope.gender,
                    birthday: $scope.birthday
                }
            })
            .then(function(res) {
                alert("Profile Updated Successfully!");
                window.location.href = '#!users'
            }).catch(function(error) {
                alert(error.data);
            })
    }

    $scope.sendMessage = function(from, to, msg) {
        $http({
            method: "POST",
            url: "/sendMsg",
            data: {
                from: from,
                to: to,
                msg: msg
            }
        }).then(function(res) {
            if (res.status == 200) {
                alert("Message Sent!");
                $scope.messsage = "";
            }
        });

    }

}]);