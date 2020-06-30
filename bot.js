require('dotenv').config();
console.log("Mastadon bot starting...");
const Mastadon = require('mastodon-api');
const fs = require('fs');

const M = new Mastadon({
    client_key: process.env.CLIENT_KEY,
    client_secret: process.env.CLIENT_SECRET,
    access_token: process.env.AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
})

const params = {
    status: "this song came from  my feed on SC\n \
    https://soundcloud.com/dannyplayamaqui/ham-ice-cream-a-meltdown \
    follow me for more cool EDM tracks \
    https://soundcloud.com/sour_cream_pringles "
}

M.post('statuses', params, (err, data, response) => {
    if (err) {
        console.log(err);
    } else {
        //reference for data output
        //fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
        console.log(data);
        console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);
        console.log(data.content);
        console.log(response);
    }
});