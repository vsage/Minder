#!/bin/env node

var PORT = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT  || 8000;
var IPADDRESS = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';


//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var server;
var io;
var app;
var argv = require('optimist').argv;
var sockets = {};
// Setup a very simple express application.
app = express();

// Allow cross origin requests.
app.use(function(req, res, next) {
    var origin = '*';
    try {
        var parts = req.headers.referer.split('/').filter(function(n){return n;});
        if (parts.length >= 2){
            origin = parts[0] + '//' + parts[1];
        }
    } catch (e) {
        // no referrer
    }
    console.log("test");
    res.header("Access-Control-Allow-Origin", "*");
/*    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");*/
/*    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');*/
/*
    res.setHeader('Access-Control-Allow-Origin', "http://localhost:8100");

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');*/
    next();
});

// How we pass our websocket URL to the client.
app.use('/varSocketURI.js', function(req, res) {
    var port = argv['websocket-port'];
    // Modify the URI only if we pass an optional connection port in.
    var socketURI = port ? ':'+port+'/' : '/';
    res.set('Content-Type', 'text/javascript');
    res.send('var socketURI="'+socketURI+'";');
});
// The client path is for client specific code.
app.use('/client', express.static(__dirname + '/client'));
// The common path is for shared code: used by both client and server.
app.use('/common', express.static(__dirname + '/common'));

app.get('/node_modules/socket.io/lib/socket.io.lib.js', function(req, res) {
    res.sendfile(__dirname + '/node_modules/socket.io/lib/socket.io.lib.js');
});

// The root path should serve the client HTML.
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});




// Our express application functions as our main listener for HTTP requests
// in this example which is why we don't just invoke listen on the app object.
server = require('http').createServer(app);
server.listen(PORT, IPADDRESS);


io = require('socket.io').listen(server);

/*io.configure(function() {
    // Logging: 3 = debug (default), 1 = warn
    var logLevel = (argv["log-level"] === undefined) ? 3 : argv["log-level"];
    io.set("log level", logLevel);
});*/



io.sockets.on('connection', function (socket) {

    console.log("connexion serv");
    // The username for this socket.
    /*var user = User();*/
    

    socket.on('set userId', function (userId) {
        sockets[userId] = socket;
        console.log(sockets);
    });
    // ___snip some stuff that appears in the code and is not copied here___

    socket.on('chat', function (data, to) {
        console.log("CHAT")
        if(sockets[to]){
            sockets[to].emit('new message', data);
        }else{
            sockets[data.from].emit('user not exist');
        }
       
        // Message passed by a client to the server with the intent of
        // broadcasting to the chatroom.
       /* if (data.user && data.user.name == user.name) {
            io.sockets.emit('chat', Message(data.message, user, "chat"));
        }
        else if (!user.name) {
            // Do not allow people to communicate without having a saved user
            // name.
            socket.emit('chat', Message(messages.invalidRequireName(), User('server'), 'error'));
            disconnectSocket();
        }
        else {
            // Do not allow people to change their name in the request alone
            // on this socket. (Example of a very pathetic amount of security).
            socket.emit('chat', Message(messages.invalidNameChange(), User('server'), 'error'));
            disconnectSocket();
        }*/
    });
});
/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express.createServer();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */


/**
 *  main():  Main code.
 */
/*var zapp = new SampleApp();
zapp.initialize();
zapp.start();*/




