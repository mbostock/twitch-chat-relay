# Twitch chat relay

This is a tiny Heroku service that allows clients to connect via WebSocket and listen to Twitch chat in a few selected rooms.

For a demo, see: https://observablehq.com/d/e2178e1acf9e2937

This service relies on several environment variables:

* TWITCH_OAUTH_TOKEN - your OAuth token, per the [Chatbots & IRC guide](https://dev.twitch.tv/docs/irc)
* TWITCH_NICK - the username for your relay’s bot
* TWITCH_CHANNELS - a comma-separated list of channels (usernames) to listen to
