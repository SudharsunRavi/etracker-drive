import express from 'express';
import qs from 'qs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// 1️⃣ Start OAuth flow
app.get('/auth/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${qs.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent',
  })}`;

  res.redirect(url);
});

// 2️⃣ Handle OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send('No code provided');

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: qs.stringify({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();

  // Redirect back to the app with access token in query
  res.redirect(`etrackerdrive://?token=${tokens.access_token}`);
});

// 3️⃣ Health check
app.get('/', (req, res) => res.send('ETRACKER BACKEND RUNNING'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
