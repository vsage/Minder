angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

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

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})

.controller('CardsCtrl', function($scope, $http, TDCardDelegate) {
  console.log('CARDS CTRL');
  var cardTypes = [
    { image: 'https://pbs.twimg.com/profile_images/659397340936077312/tkm8w-o4_400x400.png' },
  ];


  $scope.cards = Array.prototype.slice.call(cardTypes, 0);

  $scope.cardDestroyed = function(index) {
    $scope.cards.splice(index, 1);
    
  };

  $scope.addCard = function() {
    $http.get("https://randomuser.me/api/").success(function(data){
      var newUser = data.results[0].user;
      var userImage = newUser.picture.large;
      var cardType = {image : userImage}

      console.log(userImage);
      $scope.cards.push(angular.extend({}, cardType));
      console.log($scope.cards);
    });
  }

  $scope.cardSwipedLeft = function(index) {
    console.log('LEFT SWIPE');
    $scope.addCard();
  };

  $scope.cardSwipedRight = function(index) {
    console.log('RIGHT SWIPE');
    $scope.addCard();
  };

  $scope.cardPartialSwipe = function(amt) {
    
  };
    /*var newCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    newCard.id = Math.random();
    $scope.cards.push(angular.extend({}, newCard));*/
  
    $scope.imgLoaded = function(img) {

    var $img = $(img);
    $img.parent().addClass('loaded');
  };
  
})

.controller('CardCtrl', function($scope, TDCardDelegate) {

 /* $scope.cardSwipedLeft = function(index) {
    console.log('LEFT SWIPE');
    alert(2);
    $scope.addCard();
  };
  $scope.cardSwipedRight = function(index) {
    console.log('RIGHT SWIPE');
    alert(2);
    $scope.addCard();
  };*/

  $scope.imgLoaded = function(img) {

    var $img = $(img);
    $img.parent().addClass('loaded');
  };
  
  

});
