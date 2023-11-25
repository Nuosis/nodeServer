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
url -X POST http://localhost:4040/register \ 
-H "Content-Type: application/json" \
-d '{"username": "test@example.com", "password": "yourpassword"}'

# Email Verification endpoint
/email_verification (GET)

# prm webhook
/prm/twilio (POST)

# Xlsx to Json
/convert-xlsx-to-json (POST)
curl -X POST http://localhost:4040/convert-xlsx-to-json -H "Content-Type: application/json" -d '{"fileUrl": <URL TO XLSX FILE>, "formName": "Tiercon"}'
    AVAILABLE FORM NAMES
    - Tiercon
