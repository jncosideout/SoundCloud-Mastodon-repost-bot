# SoundCloud-Mastodon-repost-bot
A bot designed to repost from a SoundCloud feed onto the Mastodon Fediverse.

Really, it's just a script that posts links read from a text file to a Fediverse server, such as Mastodon, or Pleroma.
## History
Unfortunately, SoundCloud stopped accepting new requests for API keys 3 years ago. So I couldn't tap into my SC account and get my live  feed.

I also tried several node packages that are wrappers for the API like :

- https://www.npmjs.com/package/soundcloud-v2-api (**outdated/abandoned**)
- https://www.npmjs.com/package/node-soundcloud (**outdated/abandoned**)
- https://www.npmjs.com/package/soundcloud.ts

but they all require you to authenticate if you want to access a user's profile. Authentication would require registering an app with SC, which they have made very difficult.

Since I failed to achieve the main goal of reading new posts from my SC feed in real-time, so I came up with a hack of reading from .txt file of all the tracks I have reposted and favorited.

This project goes hand-in-hand with a webscraper I built to collect those urls from my SC profile's repost page. You can see that at https://github.com/jncosideout/SC-reposts-webscraper
## Development
- bot.js is the script I run in "production"
- bot-daemon.js is now the script I use for testing
   - it mirrors the code from bot.js but reads from test data files and posts statuses with "direct" visibility

### Background on the file names
The following is only relevant to the development history of this, and unique to my journey. But read on if you insist.

I started this project years ago when I was still learning things. For example, I made different copies of the same file for different purposes (instead of using git branches).

Since I run these scripts using systemd (go ahead and hate), and was learning systemd at the time, I named one file bot-daemon.js to be the version I ran as a timer-triggered unit.