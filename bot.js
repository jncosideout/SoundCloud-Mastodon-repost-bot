console.log("Mastadon bot starting...");
const Mastadon = require('mastodon-api');
const Env = require('dotenv').config();

const M = new Mastadon({
    client_key: process.env.CLIENT_KEY,
    client_secret: process.env.CLIENT_SECRET,
    access_token: process.env.AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
})

const params = {
    status: "sourCreamPringles is listening to this track on SoundCloud",
    media_id: "soundcloud url goes here?"
}

M.post(statuses, params, (err, data, response) => {
    if (err) {
        console.log(err);
    } else {
        console.log(data);
        console.log(response);
    }
});