require('dotenv').config();
console.log("Mastadon bot starting...");
const Mastadon = require('mastodon-api');
// const fs = require('fs'),
//       es = require('event-stream'),
//       os = require('os'),
//       path1 = './songNumber.txt',
//       path2 = 'scpLikesAndReposts.txt';
var songToPost = "https://soundcloud.com/legowelt-official/legowelt-under-a-golden-dome-from-the-pancakes-with-mist-album";
    // songNumber = 0,
    // data = fs.readFileSync(path1);


const M = new Mastadon({
    client_key: process.env.M_CLIENT_KEY,
    client_secret: process.env.M_CLIENT_SECRET,
    access_token: process.env.M_AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
})
toot(songToPost);
// console.log("song number is: " + data);
// var char1 = String.fromCharCode(data[0]);
// songNumber = parseInt(char1);

// var i = 0;

// var s = fs.createReadStream(path2)
//     .pipe(es.split())
//     .pipe(es.mapSync(function(song) {
//             if (i <= songNumber) {
//                 // pause the readstream
//                 s.pause();
//                 if (i <= songNumber) {
//                     console.log("song was read: ", song);
//                 }
//                 i++;
//                 console.log('i incremented to ' + i);
//                 if (i > songNumber) {
//                     console.log('songToPost = ' + song);
//                     songToPost = song;
//                     songNumber = i;
//                     console.log('songNumber incremented to ' + songNumber);                    
//                     s.emit('end');
//                 } else {
//                     s.resume();
//                 }
//             }
//         })
//         .on('error', function(err) {
//             console.log('Error: ', err);
//         })
//         .on('end', function(){
//             console.log('Finished Reading');
//             const i_as_string = i.toString();
//             fs.writeFileSync(path1, i_as_string);
//             // finally, toot the new song
//             toot(songToPost);
//         })
//     );




function toot(newSong) {
    const params = {
        status: "this song came from  my feed on SC\n\n"
        + newSong + "\n\n" +
        "follow me for more cool EDM tracks on SC:\n\n"
        + "https://soundcloud.com/sour_cream_pringles"
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