# nodeServer

CREATED 2023/11/18

PLIST LOC /Library/LaunchDaemons/com.clarity.webhook.plist
ERROR LOG /tmp/com.clarityWebhook.node.err
STD OUT /tmp/com.clarityWebhook.node.out

TO MOVE/RECREATE
1) generate home directory
2) install node 
3) install web hook dependencies (express, axis, jwt, crypto)
4) install python and virtual environment at project root
	⁃	update line 144 of app.js scriptPath to point to python3 in venv
5) set up/check .env file and test it is seeing values
	if self hosted, set up launchctl 
	1) create com.clarity.webhook.plist at /library/launchdaemons/ (copy one from here
	2) load it 
	3) update ENV VARIABLES section to house all local variables needed
6) set up port forwarding
7) set up SSL 


START/STOP
To launch manually 
	launchctl start /Library/LaunchDaemons/com.clarity.webhook.plist
To stop server 
	sudo launchctl stop com.webhook.node
	to fully stop server you need to launchctl unload /Library/LaunchDaemons/com.clarity.webhook.plist then stop server
START
	sudo launchctl start com.webhook.node

TEST 
	PORT=5050 node app.js

ENDPOINTS
Root 
http://184.71.24.34:4040 || localhost:4040

Basic End Point
/ (GET)
curl -X GET http://localhost:4040

Validate Auth
/validate (GET)
curl --location 'http://localhost:4040/validate' --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlLZXkiOiI1OWY0YTY0ZjE3OGQ1ZmQzM2M1MWI0NTI5MzNkOWU1ZjAyY2YyMmVlOTUyNWFlNDNiNTQ5OWY4MmM2YTkxYmU2IiwiaWF0IjoxNzAwNTE3OTg0fQ.mSdehQrzB5cZ40wnrKtT0xnKe4xumyT4IaeQeH6hX5Q'

To create new key
node /Users/server/node/generateApiKey.js 

prm webhook
/prm/twilio (POST)

Xlsx to Json
/convert-xlsx-to-json (POST)
curl -X POST http://localhost:4040/convert-xlsx-to-json -H "Content-Type: application/json" -d '{"fileUrl": "https://server.selectjanitorial.com/files/xlsxComplex.xlsx", "formName": "Tiercon"}'

Call directly in command line 
python3 /Users/server/node/XLSX_to_JSON/xlsx_to_json.py 'https://server.selectjanitorial.com/files/xlsxComplex.xlsx' 'Tiercon'
