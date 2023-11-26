#!/bin/bash

# Script to move a PDF from a temporary location to the web server's image folder

# Ensure the file path is passed as an argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_pdf>" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut' 2>&1
    exit 1
fi

# Variables
PDF_PATH="$1"
DESTINATION_PATH="/Library/FileMaker Server/HTTPServer/htdocs/httpsRoot/images"
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Move the file
mv "$PDF_PATH" "$DESTINATION_PATH"

# Check if the move was successful
if [ $? -eq 0 ]; then
    echo "$timestamp: File moved successfully." >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
else
    # Capture the last error message
    errorMessage=$(mv "$PDF_PATH" "$DESTINATION_PATH" 2>&1)

    echo "$timestamp: Failed to move file. Error: $errorMessage" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    exit 1
fi


# EXAMPLE CLI  /Library/FileMaker\ Server/Data/Scripts/moveSavedFile.sh <<PATH TO FILE>>
# macOS FileMaker Use the "Perform AppleScript" step with a calculation like this: "do shell script \"/Library/FileMaker\ Server/Data/Scripts/moveSavedFile.sh " & YourFilePathVariable & "\""
# winOS Use the "Send Event" script step with a calculation similar to this: "cmd /c \"/path/to/your/script.bat " & YourFilePathVariable & "\""
