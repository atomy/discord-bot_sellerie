# Introduction 
Bot counting sellerie consumption, adding up for each day and putting total amount in its status.

# Requirements
- API key for Discord-Bot

# Build
Configure vars.sh.dist, rename to vars.sh.

```
$ source ./vars.sh
$ ./scripts/build.sh
```

# Run
## Locally
```
$ source ./vars.sh
$ node bot.js
```

## Docker
(Uses prior build image, changes in code will not be reflected.)

```
$ docker-compose up
```