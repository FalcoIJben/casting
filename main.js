/**
 * Created by jonathan on 11/12/16.
 */
var setup_receiver = function () {
    cast.receiver.logger.setLevelValue(0);
    window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    console.log('Starting Receiver Manager');

    // handler for the 'ready' event
    castReceiverManager.onReady = function (event) {
        console.log('Received Ready event: ' + JSON.stringify(event.data));
        window.castReceiverManager.setApplicationState("Application status is ready...");


        $('#message').innerHTML('<h2>palla</h2>')
    };

    // handler for 'senderconnected' event
    castReceiverManager.onSenderConnected = function (event) {
        console.log('Received Sender Connected event: ' + event.data);
        console.log(window.castReceiverManager.getSender(event.data).userAgent);
    };

    // handler for 'senderdisconnected' event
    castReceiverManager.onSenderDisconnected = function (event) {
        console.log('Received Sender Disconnected event: ' + event.data);
        if (window.castReceiverManager.getSenders().length == 0) {
            window.close();
        }
    };

    // handler for 'systemvolumechanged' event
    castReceiverManager.onSystemVolumeChanged = function (event) {
        console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' +
            event.data['muted']);
    };
    // create a CastMessageBus to handle messages for a custom namespace
    window.messageBus =
        window.castReceiverManager.getCastMessageBus(
            'urn:x-cast:com.google.cast.asd.palla');
    // handler for the CastMessageBus message event
    window.messageBus.onMessage = function (event) {
        console.log('Message [' + event.senderId + ']: ' + event.data);
        // display the message from the sender
        displayText(event.data);
        // inform all senders on the CastMessageBus of the incoming message event
        // sender message listener will be invoked
        window.messageBus.send(event.senderId, event.data);
    }
    // initialize the CastReceiverManager with an application status message
    window.castReceiverManager.start({statusText: "Application is starting"});
    console.log('Receiver Manager started');
};


var setup_sender =  function() {
    var applicationID = '794B7BBF';
    var namespace = 'urn:x-cast:com.google.cast.asd.palla';
    var session = null;
    /**
     * Call initialization for Cast
     */
    if (!chrome.cast || !chrome.cast.isAvailable) {
        setTimeout(initializeCastApi, 1000);
    }
    /**
     * initialization
     */
    function initializeCastApi() {
        var sessionRequest = new chrome.cast.SessionRequest(applicationID);
        var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
            sessionListener,
            receiverListener);
        chrome.cast.initialize(apiConfig, onInitSuccess, onError);
    };
    /**
     * initialization success callback
     */
    function onInitSuccess() {
        appendMessage("onInitSuccess");
    }

    /**
     * initialization error callback
     */
    function onError(message) {
        appendMessage("onError: " + JSON.stringify(message));
    }

    /**
     * generic success callback
     */
    function onSuccess(message) {
        appendMessage("onSuccess: " + message);
    }

    /**
     * callback on success for stopping app
     */
    function onStopAppSuccess() {
        appendMessage('onStopAppSuccess');
    }

    /**
     * session listener during initialization
     */
    function sessionListener(e) {
        appendMessage('New session ID:' + e.sessionId);
        session = e;
        session.addUpdateListener(sessionUpdateListener);
        session.addMessageListener(namespace, receiverMessage);
    }

    /**
     * listener for session updates
     */
    function sessionUpdateListener(isAlive) {
        var message = isAlive ? 'Session Updated' : 'Session Removed';
        message += ': ' + session.sessionId;
        appendMessage(message);
        if (!isAlive) {
            session = null;
        }
    };
    /**
     * utility function to log messages from the receiver
     * @param {string} namespace The namespace of the message
     * @param {string} message A message string
     */
    function receiverMessage(namespace, message) {
        appendMessage("receiverMessage: " + namespace + ", " + message);
    };
    /**
     * receiver listener during initialization
     */
    function receiverListener(e) {
        if (e === 'available') {
            appendMessage("receiver found");
        }
        else {
            appendMessage("receiver list empty");
        }
    }

    /**
     * stop app/session
     */
    function stopApp() {
        session.stop(onStopAppSuccess, onError);
    }

    /**
     * send a message to the receiver using the custom namespace
     * receiver CastMessageBus message handler will be invoked
     * @param {string} message A message string
     */
    function sendMessage(message) {
        if (session != null) {
            session.sendMessage(namespace, message, onSuccess.bind(this, "Message sent: " + message), onError);
        }
        else {
            chrome.cast.requestSession(function (e) {
                session = e;
                session.sendMessage(namespace, message, onSuccess.bind(this, "Message sent: " + message), onError);
            }, onError);
        }
    }

    /**
     * append message to debug message window
     * @param {string} message A message string
     */
    function appendMessage(message) {
        console.log(message);
        var dw = document.getElementById("debugmessage");
        dw.innerHTML += '\n' + JSON.stringify(message);
    };
    /**
     * utility function to handle text typed in by user in the input field
     */
    function update() {
        sendMessage(document.getElementById("input").value);
    }

    /**
     * handler for the transcribed text from the speech input
     * @param {string} words A transcibed speech string
     */
    function transcribe(words) {
        sendMessage(words);
    }

}

// utility function to display the text message in the input field
function displayText(text) {
    console.log(text);
    document.getElementById("message").src = text;
    window.castReceiverManager.setApplicationState(text);
};







