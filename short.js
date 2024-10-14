const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const mongoURI = 'mongodb+srv://alanqwerty:qwerty123@cluster0.cjvb1q8.mongodb.net/mydatabase?retryWrites=true&w=majority';

// Koneksi ke MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Definisikan schema untuk URL Shortener
const urlSchema = new mongoose.Schema({
  customId: { type: String, unique: true, required: true },
  eurl: { type: String, required: true },
});

const Url = mongoose.model('Url', urlSchema);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>URL Shortener</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body {
          background-color: #f8f9fa;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body>
      <div class="container text-center">
        <h1 class="mb-4">URL Shortener</h1>
        <div class="mb-3">
          <input type="text" id="url" class="form-control" placeholder="Enter URL" />
        </div>
        <div class="mb-3">
          <input type="text" id="customId" class="form-control" placeholder="Custom ID (optional)" />
        </div>
        <button onclick="createShortLink()" class="btn btn-primary">Create Shortlink</button>
        <p id="result" class="mt-3"></p>
        <p id="error" class="text-danger mt-3"></p>
      </div>

      <script>
        async function createShortLink() {
          const url = document.getElementById('url').value;
          const customId = document.getElementById('customId').value;
          const result = document.getElementById('result');
          const error = document.getElementById('error');
          result.textContent = '';
          error.textContent = '';

          const response = await fetch('/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, customId })
          });
          const data = await response.json();

          if (data.error) {
            error.textContent = data.error;
          } else {
            result.textContent = \`Shortlink created: \${data.shortUrl}\`;
            result.innerHTML = \`<a href="\${data.shortUrl}" target="_blank">\${data.shortUrl}</a>\`;
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const urlData = await Url.findOne({ customId: id });
    if (urlData) {
      res.redirect(urlData.eurl);
    } else {
      res.status(404).send('Shortlink not found');
    }
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/create', async (req, res) => {
  const { url, customId } = req.body;

  try {
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let id = customId;

    if (!id) {
      id = Math.random().toString(36).substr(2, 6);
      while (await Url.findOne({ customId: id })) {
        id = Math.random().toString(36).substr(2, 6);
      }
    } else {
      const existing = await Url.findOne({ customId: id });
      if (existing) {
        return res.status(400).json({ error: 'Custom URL already exists' });
      }
    }

    const newUrl = new Url({ customId: id, eurl: url });
    await newUrl.save();

    res.json({ shortUrl: `https://s.alxzy.xyz/${id}` });
  } catch (error) {
    console.error('Error creating shortlink:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
