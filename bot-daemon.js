import { config } from "dotenv"
config()
const post_frequency = process.env.POST_VISIBILITY_FREQUENCY,
    instance_url = process.env.M_INSTANCE_URL,
    access_token = process.env.M_AUTH_TOKEN
console.log("Mastodon bot starting...");
import { createRestAPIClient } from "masto"

import fs, { access } from 'fs'
import pkg from "event-stream"
const { split, mapSync } = pkg

const path1 = 'songNumberTEMP.txt',
      path2 = 'scpLikesAndRepostsTEMP.txt',
      path3 = 'totalSongsNumberTEMP.txt';
var songToPost = "",

    songNumber = 0,
    songNumData = [],
    currentSongNumStr = "",
    //in case we fail to post, store the old num
    oldSongNumStr = "",

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

if (songNumber >= totalSongNum) {
    songNumber = 0;
    console.log('songNumber reset to zero since we reached EOF on last run')
}

const masto = createRestAPIClient({
    url: instance_url,
    accessToken: access_token,
    timeout: 60*1000,  // optional HTTP request timeout in milliseconds to apply to all requests.
})

var i = 0;
var s = fs.createReadStream(path2)
    .pipe(split())
    .pipe(mapSync(function(song) {
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
                    // "SONG_FOUND" custom error to catch, but unnecessary b/c destroy() calls .on(close)
                    s.destroy("SONG_FOUND")
                    return
                } 

                s.resume();                
        })
        .on('error', function(err) {
            // error "SONG_FOUND" never called
            if (err === "SONG_FOUND") {
                console.log('Finished Reading .on(error === "SONG_FOUND")');
                console.log(err)
                totalSongStr = i.toString();
                currentSongNumStr = i_as_string;
                // finally, toot the new song
                // toot(songToPost);
                //DEBUG to circumvent toot(), remove updateSongNum() in production
                updateSongNum(currentSongNumStr)
            } else {
                console.log("error 4324324312")
                reject('Error occurred, errno=:' + err.errno + '\n', err);
                process.exit(1)
            }
        })
        // on(end) doesn't get called
        // because the stream is ended early before reaching EOF
        // so totalSongStr does not equal the real total, and gets set == to the currentSongNumStr
        .on('end', function(){
            console.log('Finished Reading .on(end)');
            totalSongStr = i.toString();
            currentSongNumStr = i_as_string;
            // finally, toot the new song
            // toot(songToPost);
            //DEBUG to circumvent toot(), remove updateSongNum() in production
            updateSongNum(currentSongNumStr)
        })
        // on(close) gets called by mapstream.destroy() when song is found
        .on('close', function(){
            console.log('Finished Reading .on(close)');
            totalSongStr = i.toString();
            currentSongNumStr = i_as_string;
            // finally, toot the new song
            // toot(songToPost);
            //DEBUG to circumvent toot(), remove updateSongNum() in production
            updateSongNum(currentSongNumStr)
        })
    );

function toot(newSong) {
    const _visibility = songNumber % post_frequency == 0 ? 'public' : 'unlisted'

    const statusParams = {
        status: "this song came from  my feed on SoundCloud: ⬇️\n\n"
        + newSong + "\n\n" +
        "for more cool electronic music go here: ⬇️ \n\n"
        + "https://soundcloud.com/sour_cream_pringles" +
        "\n\n" + "#EDM #acid #electro #IDM" + "\n\n\n\n" +
        "♬♫♪ ヽ(⌐■_■)ﾉ ♪♫♬",
        visibility: "direct"
    }

    masto.v1.statuses.create.$raw(statusParams)
        .then( function (promiseObject) {
            const data = promiseObject.data,
                headers = promiseObject.headers
            if (data.url) {
                //SUCCESS
                console.log('success! :)')
                console.log(`here is the toot on ${instance_url}:`)
                console.log(`ID: ${data.id} and timestamp: ${data.createdAt}`)
                console.log(data.url)
                console.log("========================")
                // update songNum after posting to Mastodon
                console.log("incrementing songNumber")
                updateSongNum(currentSongNumStr)
            } else {
                console.log("request failed")
                console.log("songNumber not changed: " + oldSongNumStr)
                console.log("headers\n========================")
                for (const pair of headers.entries()) {
                    console.log(`    ${pair[0]}: ${pair[1]}`);
                }
                if (data.error) {
                    console.log("========================")
                    console.log("data.error\n    " + data.error)
                }
                process.exit(1)
            }
        })
        .catch( function (err) {
            //MastoHttpError properties
            const statusCode = err.statusCode,
                    message = err.message,
                    description = err.description,
                    details = err.details,
                    additionalProperties = err.additionalProperties
            console.log("masto post status failed, error = " )
            console.log(message + "\n=======================")
            if (statusCode) {
                console.log(`statusCode= ${statusCode}`)
            }
            if (description) {
                console.log(description + "\n=======================")
            }
            if (details) {
                console.log(details + "\n=======================")
            }
            if (additionalProperties) {
                if (additionalProperties.errors) {
                    console.log(additionalProperties.errors.detail + "\n=======================")
                }
            }
            console.log(err.stack)
            console.log("songNumber not changed:" + oldSongNumStr)
            process.exit(1)
        })
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
        process.exit(1)
    }
}