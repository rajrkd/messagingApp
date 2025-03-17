const express = require('express');
const hook = express.Router();

const verify_token = "schedular-callback";

hook.post('/', express.json(), (req, res) => {
    const { object, entry } = req.body;

    if (object === 'instagram') {
      entry.forEach(({ changes }) => {
        changes.forEach((change) => {
          console.log(change.field);
          switch (change.field) {
            case 'mentions':
              console.log('New mention:', change.value);
              break;
            case 'comments':
              console.log('New comment:', change.value);
              break;
           // case 'messages':
           //     console.log('message ', change.value);
            // Handle other event types
          }
        });
      });
    }

    res.sendStatus(200);
});


hook.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    //const mode = "subscribe";
    //const token = "schedular-callback";
    const challenge = req.query['hub.challenge'];
    console.log(mode,token);
  
    if (mode && token === verify_token) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  module.exports= hook;
//hook.listen(3000, () => console.log('Webhook server is listening!'));