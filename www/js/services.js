angular.module('starter.services', [])


//Gestion du Login

.service('AuthService', function($q, $http, USER_ROLES, $rootScope) {
/*  var LOCAL_TOKEN_KEY = 'serverToken';
  var username = '';
  var isAuthenticated = false;
  var role = '';
  var authToken;
 
  function loadUserCredentials() {

    var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    if (token) {
      useCredentials(token);
    }
  }
 
  function storeUserCredentials(token) {
    window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
    useCredentials(token);
  }
 
  function useCredentials(token) {
    username = token.split('.')[0];
    isAuthenticated = true;
    authToken = token;
 
    if (username == 'admin') {
      role = USER_ROLES.admin
    }
    if (username == 'user') {
      role = USER_ROLES.public
    }
 
    // Set the token as header for your requests!
    //$http.defaults.headers.common['X-Auth-Token'] = token;
  }
 
  function destroyUserCredentials() {
    authToken = undefined;
    username = '';
    isAuthenticated = false;
    $http.defaults.headers.common['X-Auth-Token'] = undefined;
    window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    window.localStorage.removeItem("fbId");
    window.localStorage.clear();
  }
 
  var login = function(name, pw) {
    return $q(function(resolve, reject) {
      if ((name == 'admin' && pw == '1') || (name == 'user' && pw == '1')) {
        // Make a request and receive your auth token from your server
        storeUserCredentials(name + '.yourServerToken');
        resolve('Login success.');
      } else {
        reject('Login Failed.');
      }
    });
  };
 
  var logout = function() {
    destroyUserCredentials();
  };
 
  var isAuthorized = function(authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
  };*/

  var storeUserInformationOnServer = function(parseUser, dataFb){
    parseUser.set("gender",dataFb.gender);
    parseUser.set("birthday",dataFb.birthday);
    parseUser.set("firstName",dataFb.first_name);
    parseUser.set("lastName",dataFb.last_name);
    parseUser.set("fbId",dataFb.id);
    parseUser.save(null, {
      success: function(user) {
        // This succeeds, since the user was authenticated on the device

        // Get the user from a non-authenticated method
        //console.log("storedInfo");
        
      },error: function(user, error) {
        console.log(error);
      }
    });

  }

  var logout = function() {
    /*destroyUserCredentials();*/
    window.localStorage.clear();
    $rootScope.$broadcast('logout');
    console.log(window.localStorage.getItem("genderToCall"));
  };

/*  loadUserCredentials();*/
 
  return {
    logout: logout,
/*    login: login,
    isAuthorized: isAuthorized,*/
    storeUserInformationOnServer: storeUserInformationOnServer
/*    isAuthenticated: function() {return isAuthenticated;},
    username: function() {return username;},
    role: function() {return role;}*/
  };
})

.service('SettingsService', function($rootScope,$timeout) {
 
  function storeSimpleValue(key, value) {
    window.localStorage.setItem(key, value);
  };

  function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }

  var storeLoginSettings = function(response){
    storeSimpleValue("fbId",response.id);
    storeSimpleValue("userFirstName",response.first_name);
    storeSimpleValue("userLastName",response.last_name);
    if(!window.localStorage.getItem("pictures")){
      pics = new Array();
      pics.push(response.picture);
      window.localStorage.setItem("pictures",JSON.stringify(pics));
    }else{
      pics = window.localStorage.getItem("pictures");
      pics = JSON.parse(pics);
      pics.push(response.picture);
      window.localStorage.setItem("pictures",JSON.stringify(pics));
    }
    var age = getAge(response.birthday);
    storeSimpleValue("age",age);
    storeSimpleValue("gender",response.gender);
    storeSimpleValue("genderToCall",response.gender=="male"?"female":"male");


    /*$timeout(function(){
        $rootScope.$broadcast('settingsStored');
    }, 1000);*/
    /*$rootScope.$broadcast('settingsStored');*/
    $rootScope.$broadcast('settingsStored');
  }


  return {
    storeLoginSettings: storeLoginSettings,
    username: function() {return username;}
  };
})

.service('MatchingService', function($q) {

  var getUsersOfGenderAndAgeAndDistance = function(gender, likesArray){
    console.log("gender called frome getUsers : " + gender + likesArray);
    var query = new Parse.Query(Parse.User);
    var deferred = $q.defer();
    query.equalTo("gender", gender);
    likesArray?query.notContainedIn("objectId",likesArray.get("seen")):void 0;
    query.limit(10);
    query.find({
      success: function(people) {
        deferred.resolve(people);
      }, error: function(){
        deferred.reject(null);
      }
    });
    return deferred.promise;
  }

  var retrieveLikesArray = function(likesArray,userId){
    var query = new Parse.Query(likesArray);
    var deferred = $q.defer();
    query.equalTo("userId", userId);
    query.limit(1);
    query.find({
      success: function(result) {
        if(result.length == 0){
          deferred.reject(null);
        }else{
          deferred.resolve(result);
        }
        // Do something with the returned Parse.Object values
      },
      error: function(error) {
        deferred.reject(null);
        alert("Error: " + error.code + " " + error.message);
      }
    });
    return deferred.promise;
  }

  return {
    getUsersOfGenderAndAgeAndDistance: getUsersOfGenderAndAgeAndDistance,
    retrieveLikesArray: retrieveLikesArray
  };
})


/*.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthorized
      }[response.status], response);
      return $q.reject(response);
    }
  };
})

.config(function ($httpProvider) {
   $httpProvider.interceptors.push('AuthInterceptor');
})
*/


//Gestion du Chat

.factory('Socket', function(socketFactory){
  var myIoSocket = io.connect('http://localhost:3000');
  mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  return mySocket;
})

.factory('Users', function(){
    var usernames = [];
    usernames.numUsers = 0;

    return {
      getUsers: function(){
        return usernames;
      },
      addUsername: function(username){
        usernames.push(username);
      },
      deleteUsername: function(username){
        var index = usernames.indexOf(username);
        if(index != -1){
          usernames.splice(index, 1);
        }
      },
      setNumUsers: function(data){
        usernames.numUsers = data.numUsers;
      }
  };
})

.factory('Chat', function($ionicScrollDelegate, Socket, Users){

  var username;
  var users = {};
  users.numUsers = 0;

  var messages = [];
  var TYPING_MSG = 'is typing';

  var Notification = function(username,message){
    var notification          = {};
    notification.username     = username;
    notification.message      = message;
    notification.notification = true;
    return notification;
  };

  Socket.on('login', function (data) {
    Users.setNumUsers(data);
  });

  Socket.on('new message', function(msg){
      addMessage(msg);
  });

  Socket.on('typing', function (data) {
    var typingMsg = {
      username: data.username,
      message: TYPING_MSG
    };
    addMessage(typingMsg);
  });

  Socket.on('stop typing', function (data) {
    removeTypingMessage(data.username);
  });

  Socket.on('user joined', function (data) {
    var msg = data.username + ' joined';
    var notification = new Notification(data.username,msg);
    addMessage(notification);
    Users.setNumUsers(data);
    Users.addUsername(data.username);
  });

  Socket.on('user left', function (data) {
    var msg = data.username + ' left';
    var notification = new Notification(data.username,msg);
    addMessage(notification);
    Users.setNumUsers(data);
    Users.deleteUsername(data.username);
  });

  var scrollBottom = function(){
    $ionicScrollDelegate.resize();
    $ionicScrollDelegate.scrollBottom(true);
  };

  var addMessage = function(msg){
    msg.notification = msg.notification || false;
    messages.push({
        username: "ricardo",
        message: msg
      });
    scrollBottom();
  };

  var removeTypingMessage = function(usr){
    for (var i = messages.length - 1; i >= 0; i--) {
      if(messages[i].username === usr && messages[i].message.indexOf(TYPING_MSG) > -1){
        messages.splice(i, 1);
        scrollBottom();
        break;
      }
    }
  };

  return {
    getUsername: function(){
      return username;
    },
    setUsername: function(usr){
      username = usr;
    },
    getMessages: function() {
      return messages;
    },
    sendMessage: function(msg){
      messages.push({
        username: username,
        message: msg
      });
      scrollBottom();
      Socket.emit('send message', msg);
    },
    scrollBottom: function(){
      scrollBottom();
    }
  };
})


.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
