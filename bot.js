require('dotenv').config();
var SC = require('soundcloud');

SC.initialize({
    client_id: process.env.SC_CLIENT_ID,
    oauth_token: process.env.SC_AUTH_TOKEN
})
console.log("getting sourcreampringles soundcloud reposts")
SC.put('/me',{
    user: {description: 'I am using the SouncCloud API!'}
}).then(function(){
    return SC.get('/me');
}).then(function(me){
    console.log(me.description);
}).catch(function(error){
    console.log(error);
});


// console.log("Mastadon bot starting...");
// const Mastadon = require('mastodon-api');
// const fs = require('fs');

// const M = new Mastadon({
//     client_key: process.env.M_CLIENT_KEY,
//     client_secret: process.env.M_CLIENT_SECRET,
//     access_token: process.env.M_AUTH_TOKEN,
//     timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
//     api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
// })

function toot() {
    const params = {
        status: "this song came from  my feed on SC\n\n \
        https://soundcloud.com/gatedrecordings/sets/uf0-im-lost-gtd009\n\n \
        follow me for more cool EDM tracks on SC:\n\n \
        https://soundcloud.com/sour_cream_pringles "
    }

    M.post('statuses', params, (err, data, response) => {
        if (err) {
            console.log(err);
        } else {
            //reference for data output
            //fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
            //console.log(data);
            console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);
            console.log(data.content);
            //console.log(response);
        }
});
}