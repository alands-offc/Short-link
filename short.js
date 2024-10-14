const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function readDB() {
  return JSON.parse(fs.readFileSync('./db.json', 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));
}

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

app.get('/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  
  if (db[id]) {
    res.redirect(db[id].eurl);
  } else {
    res.status(404).send('Shortlink not found');
  }
});

app.post('/create', (req, res) => {
  const { url, customId } = req.body;
  const db = readDB();
  let id;

  if (customId) {
    if (db[customId]) {
      return res.json({ error: 'Custom URL already exists' });
    }
    id = customId;
  } else {
    id = Math.random().toString(36).substr(2, 6);
    while (db[id]) {
      id = Math.random().toString(36).substr(2, 6);
    }
  }

  db[id] = { eurl: url };
  writeDB(db);

  res.json({ shortUrl: `https://s
  .alxzy.xyz/${id}` });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

