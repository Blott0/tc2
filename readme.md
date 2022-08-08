# testcase 2

## Approach

- start a node express server on port 3001
- add endpoints for increasingly complicated get requests
- add interval timer to fetch data from buienradar API
    - exclude unused data and add timestamp
    - upload data to db

## comments

- probably didnt need the /details path
- could clean this up by splitting up endpoints?
- move interval to listen callback?
- seems to be working (as far as I was able to test)

## Developing

```bash
node .
```
