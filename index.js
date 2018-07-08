'use strict';

const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json());

app.listen(process.env.PORT || 1337, () => console.log('Esther is listening'));

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

  const body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    let responseMessage;

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(entry => {

      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      const command = entry.messaging[0].message;
      console.log('I heard ' + command);

      switch (command) {
        case 'crypto':
          request('https://bx.in.th/api/', (error, response, body) => {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
          });
          break;
        default:
          responseMessage = "I don't know this command. Oink!";
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send(responseMessage);
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = 'ILoveAnimalsEspeciallyGiraffesAndPigs';

  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
