// @flow
'use strict';

// Dependencies
const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json());

// Configs
const BX_API_URL = 'https://bx.in.th/api/';
const VERIFY_TOKEN = 'ILoveAnimals';
const PAGE_ACCESS_TOKEN = 'EAADfDhyfTdgBALhiOI2OZB2igl3WpMxZCx8Cvm2ZCnDA2nUH0RmHnhni6oCudWiR59Priia7JqMKMV54VkV1YgwI8tvTpjk07Wconst OFBiuYX5aKoVPeXzDR5B8nJTEBB5fL7IrNtInluhSGqeiZBQeBGRvxpvZBxvLqfFeGfNOR9kQZDZD';
const MESSAGE_LISTENING = 'Esther is listening.';
const MESSAGE_HELP = 'c: crypto\nothers: display this message';
const WEBHOOK_ENDPOINT_NAME = '/webhook';
const WEBHOOK_EVENT_RECEIVED = 'EVENT_RECEIVED';
const WEBHOOK_VERIFICATION_RESPONSE = 'WEBHOOK_VERIFIED';
const WEBHOOK_VERIFICATION_MODE = 'subscribe';
const WEBHOOK_PAGE_SUBSCRIPTION_EVENT = 'page';
const CURRENCY_PAIRS = {'THB': {'BTC': true, 'ETH': true, 'ZMN': true}};

app.listen(process.env.PORT || 1337, () => console.log(MESSAGE_LISTENING));

// Creates the endpoint for our webhook
app.post(WEBHOOK_ENDPOINT_NAME, (req, res) => {
  const body = req.body;
  if (body.object === WEBHOOK_PAGE_SUBSCRIPTION_EVENT) {

    body.entry.forEach(({messaging}) => {
      // Gets the body of the webhook event
      const webhookEvent = messaging[0];
      console.log(webhookEvent);

      // Get the sender PSID
      const senderPSID = webhookEvent.sender.id;
      console.log(`Sender PSID: ${senderPSID}`);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhookEvent.message) {
        handleMessage(senderPSID, webhookEvent.message.text);
      } else if (webhookEvent.postback) {
        // handlePostback(senderPSID, webhookEvent.postback);
      }
    });

    // Returns a '200 OK' response as a fallback
    res.status(200).send(WEBHOOK_EVENT_RECEIVED);
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get(WEBHOOK_ENDPOINT_NAME, (req, res) => {
  const mode: ?string = req.query['hub.mode'];
  const token: ?string = req.query['hub.verify_token'];
  const challenge: ?string = req.query['hub.challenge'];

  if (mode === WEBHOOK_VERIFICATION_MODE && token === VERIFY_TOKEN) {
    // Responds with the challenge token from the request
    console.log(WEBHOOK_VERIFICATION_RESPONSE);
    res.status(200).send(challenge);
  } else {
    // Responds with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

// Handles messages sent to the bot
function handleMessage(senderPSID, text: string) {
  switch(text) {
    case 'c':
      getCryptoRates(senderPSID);
      break;
    default:
      callSendAPI(senderPSID, MESSAGE_HELP);
  }
}

function getCryptoRates(senderPSID): void {
  request(BX_API_URL, (error: ?string, response, body) => {
    if (error) {
      console.log('##### ERROR:', error);
      return;
    }

    let message = '';
    const parsed = JSON.parse(body);
    Object.keys(parsed).forEach(key => {
      const entry = parsed[key];
      if (isSubscribedPair(entry.primary_currency, entry.secondary_currency)) {
        message += `${entry.primary_currency}:${entry.secondary_currency} = ${entry.last_price}\n`;
      }
    });

    callSendAPI(senderPSID, message);
  });
}

function isSubscribedPair(primary: string, secondary: string): boolean {
  return CURRENCY_PAIRS[primary] && CURRENCY_PAIRS[primary][secondary] === true;
}

// Sends response messages via the Send API
function callSendAPI(senderPSID, message: string) {
  // Construct the message body
  const requestBody = {
    "recipient": {
      "id": senderPSID,
    },
    "message": message,
  };
  console.log(requestBody);

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": {"access_token": PAGE_ACCESS_TOKEN},
    "method": "POST",
    "json": requestBody,
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}
