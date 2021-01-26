require('dotenv').config();
console.log("Mastadon bot starting...");
const Mastadon = require('mastodon-api');
const fs = require('fs'),
      es = require('event-stream'),
      os = require('os'),
      path1 = 'songNumber.txt',
      path2 = 'scpLikesAndReposts.txt',
      path3 = 'totalSongsNumber.txt';
var songToPost = "",

    songNumber = 0,
    songNumData = [],
    currentSongNumStr = "",

    i_as_string = "",
    
    totalSongNum = 0,
    totalSongNumData = [],
    totalSongStr = "";    

try {
    songNumData = fs.readFileSync(path1);
    totalSongNumData = fs.readFileSync(path3);
} catch (error) {
    console.log("a READ error occurred, errno=" + error.errno + "\n")
    console.log(error)
    process.exit(error.errno);    
}

if (songNumData.length != 0) {
    songNumData.forEach(i => {
        currentSongNumStr += String.fromCharCode(i);
    });
} else {
    console.log('songNumData was empty');
    console.log('make sure bot-daemon.js has read access')
    process.exit(1);
}
console.log("song number is: " + songNumData);
// the actual song read will be songNumber + 1
songNumber = parseInt(currentSongNumStr);


if (totalSongNumData.length != 0) {
    totalSongNumData.forEach(i => {
        totalSongStr += String.fromCharCode(i);
    });  
} else {
    console.log('totalSongNumData was empty');
    console.log('make sure bot-daemon.js has read access');
    process.exit(1);
}

console.log("total songs number is: " + totalSongNumData);
totalSongNum = parseInt(totalSongStr);

if (songNumber == totalSongNum) {
    songNumber = 0;
}

const M = new Mastadon({
    client_key: process.env.M_CLIENT_KEY,
    client_secret: process.env.M_CLIENT_SECRET,
    access_token: process.env.M_AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
})

const NAS = new Mastadon({
    client_key: process.env.NAS_CLIENT_KEY,
    client_secret: process.env.NAS_CLIENT_SECRET,
    access_token: process.env.NAS_AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://noagendasocial.com/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
})


var i = 0;

var s = fs.createReadStream(path2)
    .pipe(es.split())
    .pipe(es.mapSync(function(song) {
                // pause the readstream
                s.pause();
                
                // the stream reads past the end of the file, causing a blank song to be read
                // so to keep the total to not be counted one above the actual total,
                // only increment if not blank
                if (song != '') {
                    i++;
                }

                if (i > songNumber && i_as_string == "") {
                    console.log('songToPost = ' + song);
                    songToPost = song;                   
                    i_as_string = i.toString();
                } 

                s.resume();                
        })
        .on('error', function(err) {
            console.log('Error occurred, errno=:' + err.errno + '\n', err);
            process.exit(err.errno)
        })
        .on('end', function(){
            console.log('Finished Reading');
            totalSongStr = i.toString();
            currentSongNumStr = i_as_string;

            try {
                fs.writeFileSync(path1, currentSongNumStr);
                console.log('songNumber incremented to ' + currentSongNumStr); 
                fs.writeFileSync(path3, totalSongStr);
                console.log('total songs = ' + totalSongStr);
            } catch(error) {
                console.log("a WRITE error occurred, errno=" + error.errno + "\n")
                console.log(error)
                process.exit(error.errno)
            }
            // finally, toot the new song
            toot(songToPost);
        })
    );




function toot(newSong) {
    const params = {
        status: "this song came from  my feed on SoundCloud: ⬇️\n\n"
        + newSong + "\n\n" +
        "for more cool electronic music go here: ⬇️ \n\n"
        + "https://soundcloud.com/sour_cream_pringles" +
        "\n\n\n\n" + "#EDM #acid #electro #IDM" + "\n\n"
    }

    M.post('statuses', params, (err, data, response) => {
        if (err) {
            console.log("an error when tooting, errno=" + err.errno)
            console.log(err);
        } else {
            console.log("here is the toot on botsin.space:\n")                
            console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);
        }
    });

    NAS.post('statuses', params, (err, data, response) => {
        if (err) {
            console.log("an error when tooting, errno=" + err.errno)
            console.log(err);
        } else {
            console.log("here is the toot on noagendasocial.com:\n")                
            console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);
        }
    });
}