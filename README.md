# nodeServer

CREATED 2023/11/18

TO MOVE/RECREATE
1) generate home directory
2) install node 
3) install web hook dependencies (express, axis, jwt, crypto)
4) install python and virtual environment at project root
	⁃	update line 144 of app.js scriptPath to point to python3 in venv
5) set up/check .env file and test it is seeing values
	if self hosted, set up launchctl 
	1) create com.clarity.webhook.plist at /library/launchdaemons/ (copy one from here)
	2) load it 
	3) update ENV VARIABLES section to house all local variables needed (Add to plist created 5.1 if using launchctl)
6) set up port forwarding
7) set up SSL 

START/STOP
npm start
ctrl+C

ENDPOINTS
Root 
http://localhost:4040

# Basic End Point
/ (GET)
curl -X GET http://localhost:4040

# Validate Auth
/validate (GET)
curl --location 'http://localhost:4040/validate' --header 'Authorization: Bearer <TOKEN>'

# Registration endpoint
/register (POST)
curl -X POST http://localhost:4040/register \ 
-H "Content-Type: application/json" \
-d '{"username": "test@example.com", "password": "yourpassword"}'

# Email Verification endpoint
/email_verification (GET)

# prm webhook
/prm/twilio (POST)
curl -X POST 'http://localhost:4040/prm/twilio' --header 'Content-Type: application/json' --data '{"ApiVersion":"2010-04-01","MessagingServiceSid":"MG607ea556bd29ee6355e4aa9948118bc4","SmsSid":"SMd5e91ae1d64f785de7f7875b6fc88fc4","SmsStatus":"received","SmsMessageSid":"SMd5e91ae1d64f785de7f7875b6fc88fc4","NumSegments":"1","From":"+17786783674","ToState":"CA","MessageSid":"SMd5e91ae1d64f785de7f7875b6fc88fc4","AccountSid":"ACce5f97d5c9b3ad77f38a8c19da249321","ToZip":"95818","FromCountry":"CA","ToCity":"SACRAMENTO","FromCity":"VICTORIA","To":"+19169999925","FromZip":"","Body":"Thanks man. It’s been quite a year","ToCountry":"US","FromState":"BC","NumMedia":"0"}'

# Xlsx to Json
/convert-xlsx-to-json (POST)
curl -X POST http://localhost:4040/convert-xlsx-to-json -H "Content-Type: application/json" -d '{"fileUrl": <URL TO XLSX FILE>, "formName": "Tiercon"}'
    AVAILABLE FORM NAMES
    - Tiercon
