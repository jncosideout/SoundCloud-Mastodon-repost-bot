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

if (songNumber == totalSongNum) {
    songNumber = 0;
    console.log('songNumber reset to zero since reached EOF')
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
                } 

                s.resume();                
        })
        .on('error', function(err) {
            console.log('Error occurred, errno=:' + err.errno + '\n', err);
            process.exit(1)
        })
        .on('end', function(){
            console.log('Finished Reading');
            totalSongStr = i.toString();
            currentSongNumStr = i_as_string;
            // finally, toot the new song
            toot(songToPost);
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

    const httpParams = {
        encoding : "multipart-form",
        requestInit: {
            headers: new Headers({ "content-type" : "multipart/form-data" }),
        }
    }

    // masto.v1.statuses.create(
    //         {
    //             status: "test1",
    //             visibility: "direct"
    //         },
    //         {
    //             // encoding : "multipart-form",
    //             requestInit: {
    //                 headers: new Headers({ "Authorization" : `Bearer ${access_token}` }),
    //             }
    //         }
    //     )
        // masto.v1.statuses.create(statusParams, httpParams)
    masto.v1.statuses.create.$raw(statusParams)
        .then( function (promiseObject) {
            const data = promiseObject.data,
                headers = promiseObject.headers,
                instanceURL = masto.url
            if (data) {
                //SUCCESS
                console.log('success! :)')
                console.log(`here is the toot on ${instanceURL}:`)
                console.log(`ID: ${data.id} and timestamp: ${data.created_at}`)
                // update songNum after posting to Mastodon
                console.log("incrementing songNumber")
                updateSongNum(currentSongNumStr)
            } else {
                console.log(`request failed,\ndata:\n${data}\n======\nheaders\n${headers}`)
                console.log("songNumber not changed: " + oldSongNumStr)
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
            if (statusCode) {
                console.log(`statusCode= ${statusCode}`)
            }
            console.log(message + "\n=======================")
            if (description) {
                console.log(description + "\n=======================")
            }
            if (details) {
                console.log(details + "\n=======================")
            }
            if (additionalProperties.errors) {
                console.log(additionalProperties.errors.detail + "\n=======================")
            }
            console.log(err.stack)
            console.log("songNumber not changed:" + oldSongNumStr)
            process.exit(1)
        })
}

function mastodonCallback(post_err, data, response, instanceURL) {
    if (post_err) {
        console.log("an error when tooting, errno=" + post_err.errno)
        console.log("post_err is\n" + post_err)
        console.log("data.error is\n" + data.error)
        console.log("songNumber not changed:" + oldSongNumStr)
        process.exit(1)
    } else if (data.length < 1) {
        console.log("no data")
        console.log("songNumber not changed:" + oldSongNumStr)
        process.exit(1)
    } else {
        rspCode = response.statusCode
        switch (true) {
            case (rspCode >= 200 && rspCode < 300):
                //SUCCESS
                console.log(`here is the toot on ${instanceURL}:`) 
                console.log(`ID: ${data.id} and timestamp: ${data.created_at}`)
                // update songNum after successful post
                console.log("incrementing songNumber")
                updateSongNum(currentSongNumStr)
                break
            default:
                console.log("request failed, response.statusCode= " + rspCode)
                console.log("post_err is\n " + post_err)
                console.log("data.error is\n" + data.error)
                console.log("songNumber not changed:" + oldSongNumStr)
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
        process.exit(1)
    }
}