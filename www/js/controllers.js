angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicPopup, $state, AuthService, AUTH_EVENTS) {
  
  //Login part
/*  $scope.username = AuthService.username();
 
  $scope.$on(AUTH_EVENTS.notAuthorized, function(event) {
    var alertPopup = $ionicPopup.alert({
      title: 'Unauthorized!',
      template: 'You are not allowed to access this resource.'
    });
  });
 
  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    AuthService.logout();
    $state.go('login');
    var alertPopup = $ionicPopup.alert({
      title: 'Session Lost!',
      template: 'Sorry, You have to login again.'
    });
  });
 
  $scope.setCurrentUsername = function(name) {
    $scope.username = name;
  };*/
})

.controller('LoginCtrl', function($scope, $state, $ionicPopup, AuthService, ngFB, $q, SettingsService, $rootScope) {

  $scope.testParse = function () {
    var TestObject = Parse.Object.extend("BaudelaireObject");
    var testObject = new TestObject();
    testObject.save({foo: "bar"}).then(function(object) {
      alert("yay! it worked");
    });
  }

  var getUserInfo = function(){
    var deferred = $q.defer();
      FB.api('/me', {
          fields: 'first_name,last_name,picture.height(320),birthday,gender',
      }, function(response) {
          if (!response || response.error) {
              deferred.reject('Error occured');
          } else {
              deferred.resolve(response);
          }
      });
    return deferred.promise;
  }

  $scope.fbLogin = function () {
    
    Parse.FacebookUtils.logIn("email,user_birthday", {
      success: function(user) {
        console.log('Facebook login succeeded');
        if (!user.existed()) {       
        } else {
        }
        getUserInfo().then(function(response){
          AuthService.storeUserInformationOnServer(user,response);
          SettingsService.storeLoginSettings(response);
          
          //console.log(response);
        })
        $state.go('tab.main', {}, {reload: true});
      },
      error: function(user, error) {
        alert("User cancelled the Facebook login or did not fully authorize.");
      }
    });

    /*ngFB.login({scope: 'email'}).then(
        function (response) {
          
          if (response.status === 'connected') {

            ngFB.api({
                path: '/me',
                params: {fields: 'id,name'}
              }).then(
              function (data) {
                  window.localStorage.setItem("fbId", data.id);
                  $state.go('tab.main', {}, {reload: true});
              },
              function (error) {
                  alert('Facebook error: ' + error.error_description);
              });
                      
          } else {
              alert('Facebook login failed');
          }
        }
      );*/
  };

  $scope.lastName = function(){
      //console.log(deferred.promise); 
  }

  $scope.fbLogout = function () {
    ngFB.logout().then(
      function (response) {
      })
  };

  $scope.fbStatus = function () {
    ngFB.getLoginStatus().then(
      function (response) {
        console.log(response);
      })
  };

  $scope.data = {};

  $scope.login = function(data) {
    AuthService.login(data.username, data.password).then(function(authenticated) {
      $state.go('tab.main', {}, {reload: true});
      //$scope.setCurrentUsername(data.username);
    }, function(err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Login failed!',
        template: 'Please check your credentials!'
      });
    });
  };
})

.controller('SettingsCtrl', function($scope,$rootScope,$timeout,$q) {
  $scope.$on("$ionicView.enter",function(){
    $scope.applySettingsFromStorage();
  })
  
  $scope.dist = 40;
  
  $scope.applySettingsFromStorage = function(){
     $timeout(function() {
      if(firstName=window.localStorage.getItem("userFirstName")){
        $scope.firstName = firstName;
      }else{
        $scope.firstName = "John"
      }

      if(lastName=window.localStorage.getItem("userLastName")){
        $scope.lastName = lastName;
      }else{
        $scope.lastName = "Doe"
      }

      if(age=window.localStorage.getItem("age")){
        $scope.age = age;
      }else{
        $scope.age = 0;
      }

      if(pics=window.localStorage.getItem("pictures")){
        $scope.pictures = JSON.parse(pics);
        //console.log($scope.pictures);
      }else{
        $scope.pictures = [];
      }

      if(gender=window.localStorage.getItem("gender")) {
        $scope.gender = gender;
      }else{
        $scope.gender="male";
      }

      if(dist=window.localStorage.getItem("distance")) {
        $scope.dist = dist;
      }else{ 
      }

      if(desc=window.localStorage.getItem("description")) {
        $scope.description = desc;
      }else{
      }
    },300);
  };

  $scope.updateValueOnServer = function(key, value){
    var deferred = $q.defer();
    var currentUser = Parse.User.current();

    if (currentUser) {
      currentUser.set(key, value);  // attempt to change username
      currentUser.save(null, {
        success: function() {
          deferred.resolve("Updated value");
        },error: function(){
          deferred.reject('Error occured');
        }
      });
    } else{

    }
    return deferred.promise;
  };

  $scope.genderChanged = function (gender) {
    window.localStorage.setItem("gender",gender);
    $scope.gender=gender;
  };
  $scope.distanceChanged = function (dist) {
    window.localStorage.setItem("distance",dist);
    $scope.dist = dist;
  };
  $scope.descriptionChanged = function (description) {

    $scope.updateValueOnServer("description",description).then(function(response){
      console.log(response);
      window.localStorage.setItem("description",description);
      $scope.description=description;
    });
  };

  $scope.applySettingsFromStorage();
})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, $ionicPopup, $timeout, Socket, Chat, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);


  $scope.data = {};
  $scope.data.message = "";
  $scope.messages = Chat.getMessages();
  var typing = false;
  var lastTypingTime;
  var TYPING_TIMER_LENGTH = 250;

  Socket.on('connect',function(){

    if(!$scope.data.username){
      var nicknamePopup = $ionicPopup.show({
      template: '<input id="usr-input" type="text" ng-model="data.username" autofocus>',
      title: 'What\'s your nickname?',
      scope: $scope,
      buttons: [{
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data.username) {
              e.preventDefault();
            } else {
              return $scope.data.username;
            }
          }
        }]
      });
      nicknamePopup.then(function(username) {
        Socket.emit('add user',username);
        Chat.setUsername(username);
      });
    }

  });

  Chat.scrollBottom();

  if($stateParams.username){
    $scope.data.message = "@" + $stateParams.username;
    document.getElementById("msg-input").focus();
  } 

  var sendUpdateTyping = function(){
    if (!typing) {
      typing = true;
      Socket.emit('typing');
    }
    lastTypingTime = (new Date()).getTime();
    $timeout(function () {
      var typingTimer = (new Date()).getTime();
      var timeDiff = typingTimer - lastTypingTime;
      if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
        Socket.emit('stop typing');
        typing = false;
      }
    }, TYPING_TIMER_LENGTH);
  };

  $scope.updateTyping = function(){
    sendUpdateTyping();
  };

  $scope.messageIsMine = function(username){
    return $scope.data.username === username;
  };

  $scope.getBubbleClass = function(username){
    var classname = 'from-them';
    if($scope.messageIsMine(username)){
      classname = 'from-me';
    }
    return classname;
  };

  $scope.sendMessage = function(msg){
    Chat.sendMessage(msg);
    $scope.data.message = "";
  };



})

.controller('AccountCtrl', function($scope, $state, AuthService) {
  $scope.settings = {
    enableFriends: true
  };
  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  };


})


.controller('CardsCtrl', function($scope, $http, TDCardDelegate, $ImageCacheFactory, $document, $ionicModal, $ionicSlideBoxDelegate, ngFB, MatchingService, $q) {
  
  var cardSwipedLastDirection = "";
  var showSpinner=false;
  var listOfNewUsersPrep=[{image:"https://randomuser.me/api/portraits/women/24.jpg"},
          {image:"https://randomuser.me/api/portraits/women/25.jpg"},
          {image:"https://randomuser.me/api/portraits/women/26.jpg"},
          {image:"https://randomuser.me/api/portraits/women/27.jpg"}];


  $scope.cards = Array.prototype.slice.call(listOfNewUsersPrep, 0);

  $scope.cardDestroyed = function(index) {

    $scope.cards.splice(index, 1);
    console.log(cardSwipedLastDirection + "SWIPE");
    $scope.addCard();
    $scope.noText=0;
    $scope.yesText=0;
    
  };

  var sortCards = function() {

    existingCards = angular.element($document[0].querySelectorAll('td-card'));
    for(i = 0; i < existingCards.length; i++) {
      card = existingCards[i];
      if(!card) continue;
      if(i > 0) {
        card.style.transform = card.style.webkitTransform = 'translate3d(0, ' + (i * 4) + 'px, 0)';
      }
      card.style.zIndex = (existingCards.length - i);

    }
  };

  $scope.getUserFbInfo = function(fbId){
    console.log(fbId);
    var deferred = $q.defer();
      FB.api(fbId, {
          fields: 'picture.height(320).width(320)',
      }, function(response) {
          if (!response || response.error) {
            console.log(response);
              deferred.reject('Error occured');
          } else {
              deferred.resolve(response);
          }
      });
    return deferred.promise;
  }

  $scope.addCard = function() {

    MatchingService.getUserOfGenderAndAgeAndDistance().then(function(persons) {
      if(persons){
        var fbId = persons[2].get("fbId");
        var description = persons[2].get("description");
        var firstName = persons[2].get("firstName");
        $scope.getUserFbInfo(fbId).then(function(data){

          if(data){
            var pictureUrl = data.picture.data.url;

            var cardType = {image : pictureUrl, username : firstName};
            $ImageCacheFactory.Cache([pictureUrl]).then(function(){
              cardType.id = Math.random();
              $scope.cards.push(angular.extend({},cardType));
              sortCards();
            },function(failed){
              console.log("failed");
            });
          }else{

          }
        });
      }else{

      }
    });

  };

  $scope.cardSwipedLeft = function(index) {
    cardSwipedLastDirection = "left";
  };

  $scope.cardSwipedRight = function(index) {
    cardSwipedLastDirection = "right"; 
  };

  $scope.cardPartialSwipe = function(amt) {
    if (amt<0) {
      $scope.noText=Math.abs(amt-0.2);
    }
    else if (amt>0) {
      $scope.yesText=Math.abs(amt+0.2);
    };

  };

  $ionicModal.fromTemplateUrl('templates/user-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {
    $scope.hideSlideBox = false;
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.hideSlideBox = true;
    $scope.modal.hide();
    $ionicSlideBoxDelegate.slide(0);
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });

})


.controller('CardCtrl', function($scope, $ionicModal, TDCardDelegate) {
})

;
