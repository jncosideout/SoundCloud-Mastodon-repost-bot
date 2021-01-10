# SoundCloud-Mastadon-repost-bot
A bot designed to repost from a SoundCloud feed onto the Mastodon Fediverse
Unfortunately, SoundCloud stopped accepting new requests for API keys 3 years ago. So I couldn't tap into my SC account and get my feed. 

I also tried several node packages that are wrappers for the API like :

https://www.npmjs.com/package/soundcloud-v2-api
https://www.npmjs.com/package/node-soundcloud
https://www.npmjs.com/package/soundcloud.ts

but they all require you to authenticate if you want to access a user's profile. Authentication would require registering with SC, which they have made very difficult.

I failed to achieve the main goal of reading new posts from my SC feed in real-time, so I came up with a hack of reading from .txt file of all the tracks I have reposted and favorited.
You can see that on branch dev2.
