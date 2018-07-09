// @flow
'use strict';

// Dependencies
const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json());

// Configs
const
  BX_API_URL = 'https://bx.in.th/api/',
  VERIFY_TOKEN = 'ILoveAnimals',
  MESSAGE_LISTENING = 'Esther is listening.',
  MESSAGE_HELP = 'c: crypto\nothers: display this message',
  WEBHOOK_ENDPOINT_NAME = '/webhook',
  WEBHOOK_VERIFICATION_RESPONSE = 'WEBHOOK_VERIFIED',
  WEBHOOK_VERIFICATION_MODE = 'subscribe',
  WEBHOOK_PAGE_SUBSCRIPTION_EVENT = 'page',
  CURRENCY_PAIRS = {'THB': {'BTC': true, 'ETH': true, 'ZMN': true}};

app.listen(process.env.PORT || 1337, () => console.log(MESSAGE_LISTENING));

// Creates the endpoint for our webhook
app.post(WEBHOOK_ENDPOINT_NAME, (req, res) => {
  const body = req.body;
  if (body.object === WEBHOOK_PAGE_SUBSCRIPTION_EVENT) {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(entry => {
      // entry.messaging is an array, but will only ever contain one message
      const command = entry.messaging[0].message;
      console.log(`I heard ${command}.`);
      switch (command) {
        case 'c':
          getCryptoRates(res);
          return;
        default:
          res.status(200).send(MESSAGE_HELP);
          return;
      }
    });

    // Returns a '200 OK' response as a fallback
    res.status(200);
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function getCryptoRates(res): void {
  let message = '';
  request(BX_API_URL, (error: ?string, response, body) => {
    if (error) {
      console.log('ERROR:', error);
      return;
    }

    const parsed = JSON.parse(body);
    Object.keys(parsed).forEach(key => {
      const entry = parsed[key];
      if (isSubscribedPair(entry.primary_currency, entry.secondary_currency)) {
        message += `${entry.primary_currency}:${entry.secondary_currency} = ${entry.last_price}\n`;
      }
    });
    res.status(200).send(message);
  });
}

function isSubscribedPair(primary: string, secondary: string): boolean {
  return CURRENCY_PAIRS[primary] && CURRENCY_PAIRS[primary][secondary] === true;
}

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
