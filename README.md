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