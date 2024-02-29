require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');

mongoose.connect('mongodb+srv://angeldvcraw:admin@cluster0.ydlfhec.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

const schema = mongoose.Schema({ original_url: {type: String, required: true}, short_url: Number });
const Urls = mongoose.model('URL', schema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use('/api/shorturl', bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);
  const url = req.body.url;
  let newShortUrl = 1;

  if (!url.match(urlRegex)) {
    res.json({ error: "invalid url" });
    return;
  }

  if(!url.includes("https://") && !url.includes("http://")) {
    res.json({ error: "invalid url" });
    return;
  }

  Urls.findOne({})
    .sort({short_url: 'desc'}).then((result) => {
      if(result != undefined) {
        newShortUrl = result.short_url + 1;
      }

      Urls.findOneAndUpdate({ original_url: url }, { original_url: url, short_url: newShortUrl }, 
        { new: true, upsert: true }).then((savedUrl) => {
          res.json({ original_url: url, short_url: newShortUrl });
        }).catch((error) => {
          console.log(error);
        });
    }).catch((err) => {
      console.log(err);
    });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const input = req.params.short_url;

  Urls.findOne({ short_url: input })
  .then((result) => {
    if(result != undefined) {
      res.redirect(result.original_url);
    } else {
      res.json({ error: "URL not found" });
    }
  })
  .catch((err) => {

  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
