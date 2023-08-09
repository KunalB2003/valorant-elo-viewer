# valorant-elo-viewer
 Valorant ELO Viewer and Tracker hosted on a Node.js Web Server using Express


## Project structure
```
Valorant-Elo-Viewer/
	- next/
		frontend written with next.js
	- app.js
		backend written with node.js + express.js

```

## Local setup
The repository contains the back- and front-end as two node projects, which must have the dependencies installed first.


### Backend
<hr/>

The backend is written with node and express

Run `npm install` and `npm run start` to start the back-end first (located in `valorant-elo-viewer/`) to start the api.

When initializing the api for the first time, you will have to add players to be tracked. This can be done by sending a GET request to the `/data/:region/:username/:id'` endpoint, where you pass the region, username, and id/tag through.

For the API, there are also two environment variables used - the port, and an optional API key. The `.env` file should look like this:

```
API_KEY=...
PORT=...
```
*Note that the api key is optional and can be omitted

### Frontend
<hr/>

The frontend uses next.js

Navigate to the `next/` directory (`valorant-elo-viewer/next/`) and install dependencies again (`npm install`). 

There is also an environment variable in use, the url of the API. The `.env` file would be located at the root of the next directory (so `valorant-elo-viewer/next/.env`), and would look like this:

```
NEXT_PUBLIC_API_URL=...
```
After installing the dependencies, you can do `npm run dev` to start a local preview.