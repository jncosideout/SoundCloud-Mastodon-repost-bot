require('dotenv').config();
console.log("Mastodon bot starting...");
const Tusk = require('tusk-mastodon');
const fs = require('fs'),
      es = require('event-stream'),
      path1 = 'memeNumber.txt',
      path2 = 'NWHouNAMeetupMemes.txt',
      path3 = 'totalMemesNumber.txt';
var memeToPost = "",

    memeNumber = 0,
    memeNumData = [],
    currentMemeNumStr = "",
    //in case we fail to post, store the old num
    oldMemeNumStr = ""
    i_as_string = "",
    
    totalMemeNum = 0,
    totalMemeNumData = [],
    totalMemeStr = "";    

try {
    memeNumData = fs.readFileSync(path1);
    totalMemeNumData = fs.readFileSync(path3);
} catch (error) {
    console.log("a READ error occurred, errno=" + error.errno + "\n")
    console.log(error)
    process.exit(error.errno);    
}

if (memeNumData.length != 0) {
    memeNumData.forEach(i => {
        currentMemeNumStr += String.fromCharCode(i);
        oldMemeNumStr = currentMemeNumStr
    });
} else {
    console.log('memeNumData was empty');
    console.log('make sure bot-daemon.js has read access')
    process.exit(1);
}
console.log("meme number is: " + memeNumData);
// the actual meme read will be memeNumber + 1
memeNumber = parseInt(currentMemeNumStr);


if (totalMemeNumData.length != 0) {
    totalMemeNumData.forEach(i => {
        totalMemeStr += String.fromCharCode(i);
    });  
} else {
    console.log('totalMemeNumData was empty');
    console.log('make sure bot-daemon.js has read access');
    process.exit(1);
}

console.log("total memes number is: " + totalMemeNumData);
totalMemeNum = parseInt(totalMemeStr);

if (memeNumber == totalMemeNum) {
    memeNumber = 0;
    console.log('memeNumber reset to zero since reached EOF')
}

const NAS = new Tusk({
    client_key: process.env.NAU_CLIENT_KEY,
    client_secret: process.env.NAU_CLIENT_SECRET,
    access_token: process.env.NAU_AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://noauthority.social/api/v1/', // optional, defaults to https://mastodon.social/api/v1/n
})



var i = 0;

var s = fs.createReadStream(path2)
    .pipe(es.split())
    .pipe(es.mapSync(function(meme) {
                // pause the readstream
                s.pause();
                
                // the stream reads past the end of the file, causing a blank meme to be read
                // so to keep the total to not be counted one above the actual total,
                // only increment if not blank
                if (meme != '') {
                    i++;
                }

                if (i > memeNumber && i_as_string == "") {
                    console.log('memeToPost = ' + meme);
                    memeToPost = meme;                   
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
            totalMemeStr = i.toString();
            currentMemeNumStr = i_as_string;
            // finally, toot the new meme
            upload(memeToPost)
                .then((result) => {
                    respCode = result.responseCode
                    params = result.params
                    toot(respCode, params)
                })
                .catch( function (err) {
                    console.log("reject after upload(memeToPost), error = " )
                    console.log(err.message + "\n=======================")
                    console.log(err.stack)
                    console.log("memeNumber not changed:" + oldMemeNumStr)
                    process.exit(1)
                });
        })
    );

async function toot(rspCode1, params) {
    switch (true) {
        // image upload response code
        case (rspCode1 > 199 && rspCode1 < 300):
            result = await NAS.post('statuses', params)
            data = result.data
            resp = result.resp
            rspCode = resp.status
            instanceURL = NAS.apiUrl
            switch (true) {
                // status message POST
                case (rspCode > 199 && rspCode < 300):
                    //SUCCESS
                    console.log('success! :)')
                    console.log(`here is the toot on ${instanceURL}:`) 
                    console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);
                    // update memeNum after posting to Mastodon
                    console.log("incrementing memeNumber")            
                    updateMemeNum(currentMemeNumStr)
                    break
                default:
                    console.log("NAS.post('statuses') failed")
                    console.log("request failed, rspCode= " + rspCode + " status " + resp.statusText)
                    if (data.error) {
                        console.log("data.error \n======================")
                        console.log(data.error)
                    }
                    console.log("memeNumber not changed:" + oldMemeNumStr)
                    process.exit(1)
            }
            break
        // media upload POST failed
        default:
            console.log("media upload failed")
            console.log("media upload http rspCode1.statusCode= " + rspCode1 + " status " + resp1.statusText)
            console.log("memeNumber not changed:" + oldMemeNumStr)
            process.exit(1)
    }
}


async function upload(newMeme) {
    //DEBUG testing Promises instead of callback
    // seems to work but Uncaught Error: getaddrinfo ENOTFOUND
    // is a bug in the mastodon-api library I'm using
    // https://stackoverflow.com/questions/64283656/nodejs-getaddrinfo-enotfound-uncaught
    return await NAS.post("media", { file: fs.createReadStream(newMeme) })
        .then((response) => {
            data1 = response.data
            resp1 = response.resp
            rspCode = resp1.status
            mediaID = data1.id
            console.log(` NAS.post(media) Success rspCode=${rspCode} mediaID=${mediaID}`)
            const params = {
                status: "🥳 😵 The 8th Northwest Houston\n" +
                        "           No Agenda Meetup! 😎\n\n" +
                        "https://noagendameetups.com/event/the-8th-northwest-houston-na-meetup/" +
                        "\n\n" +
                        "🌎 Where:\n" +
                        "- Wakefield Crowbar\n" +
                        "🕔 When\n" +
                        "- Saturday Feb. 03\n" +
                        " 🤠  🇨🇱 🌵 🦂 🚀\n" +
                        "#NorthwestHoustonNoAgendaMeetups",
                media_ids: [mediaID]
            }

            return {params: params, responseCode: rspCode}
  
        })
        // media upload POST
        .catch( function (err) {
            console.log(" NAS.post(media) or createReadStream for media upload failed" )
            console.log("response.statusCode= " + err.statusCode + " err.code " + err.code)
            console.log(err.message + "\n=======================")
            console.log(err.stack)
            console.log("memeNumber not changed:" + oldMemeNumStr)
            process.exit(1)
        })
}

function updateMemeNum(currentMemeNumStr) {
    try {
        fs.writeFileSync(path1, currentMemeNumStr);
        console.log('memeNumber changed to ' + currentMemeNumStr); 
        fs.writeFileSync(path3, totalMemeStr);
        console.log('total memes = ' + totalMemeStr);
    } catch(error) {
        console.log("a WRITE error occurred, errno=" + error.errno + "\n")
        console.log(error)
        process.exit(1)
    }
}
