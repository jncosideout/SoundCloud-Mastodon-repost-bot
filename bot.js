require('dotenv').config();
console.log("Mastadon bot starting...");
const Mastadon = require('mastodon-api');
const fs = require('fs'),
      es = require('event-stream'),
      os = require('os'),
      path1 = 'songNumberTEMP.txt',
      path2 = 'scpLikesAndRepostsTEMP.txt',
      path3 = 'totalSongsNumberTEMP.txt';
var songToPost = "",

    songNumber = 0,
    songNumData = [],
    currentSongNumStr = "",
    //in case we fail to post, store the old num
    oldSongNumStr = ""
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
        oldSongNumStr = currentSongNumStr
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
    console.log('songNumber reset to zero since reached EOF')
}

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
            // update songNum before posting to Mastodon
            console.log("incrementing songNumber")            
            updateSongNum(currentSongNumStr)
            // finally, toot the new song
            toot(songToPost);
        })
    );




function toot(newSong) {
    const params = {
        status: "this song came from  my feed on SoundCloud\n\n"
        + newSong + "\n\n" +
        "follow me for more cool electronic music here:\n\n"
        + "https://soundcloud.com/sour_cream_pringles" +
        "\n\n\n\n" + "#EDM #acid #electro #IDM" + "\n\n"
    }

    //DEBUG testing Promises instead of callback
    // seems to work but Uncaught Error: getaddrinfo ENOTFOUND
    // is a bug in the mastodon-api library I'm using
    // https://stackoverflow.com/questions/64283656/nodejs-getaddrinfo-enotfound-uncaught
    // NAS.post('statuses', params)
    //     .then( function (result) {
            console.log('success! :)')
            rspCode = 200
            data = {id:7890, created_at:"your mom"}
            instanceURL = "website.com"
            switch (true) {
                case (rspCode >= 200 && rspCode < 300):
                    //SUCCESS
                    console.log(`here is the toot on ${instanceURL}:`) 
                    console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);
                    break
                default:
                    console.log("request failed, response.statusCode= " + rspCode)
                    console.log("decrementing songNumber")
                    //write the old songNum back into the file
                    updateSongNum(oldSongNumStr)
                    process.exit(rspCode)
            }
        // })
        // .catch( function (err) {
        //     console.log("request failed, apiError = " + err)
        //     console.log(err.stack)
        //     console.log("decrementing songNumber")
        //     //write the old songNum back into the file
        //     updateSongNum(oldSongNumStr)
        //     process.exit(2)
        // })
}

function mastodonCallback(post_err, data, response, instanceURL) {
    if (post_err) {
        console.log("an error when tooting, errno=" + post_err.errno)            
        console.log(post_err)
        console.log("decrementing songNumber")
        //write the old songNum back into the file
        updateSongNum(oldSongNumStr)
        process.exit(post_err.errno)
    } else if (data.length < 1) {
        console.log("no data")
        console.log("decrementing songNumber")
        //write the old songNum back into the file
        updateSongNum(oldSongNumStr)
        process.exit(1)
    } else {
        rspCode = response.statusCode
        switch (true) {
            case (rspCode >= 200 && rspCode < 300):
                //SUCCESS
                console.log(`here is the toot on ${instanceURL}:`) 
                console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);            
            default:
                console.log("request failed, response.statusCode= " + rspCode)
                console.log("decrementing songNumber")
                //write the old songNum back into the file
                updateSongNum(oldSongNumStr)
                process.exit(1)
        }
    }
}
function updateSongNum(currentSongNumStr) {
    try {
        fs.writeFileSync(path1, currentSongNumStr);
        console.log('songNumber changed to ' + currentSongNumStr); 
        fs.writeFileSync(path3, totalSongStr);
        console.log('total songs = ' + totalSongStr);
    } catch(error) {
        console.log("a WRITE error occurred, errno=" + error.errno + "\n")
        console.log(error)
        process.exit(error.errno)
    }
}