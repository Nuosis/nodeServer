#!/bin/bash

# Script to move a PDF from a temporary location to the web server's image folder

# Variables
timestamp=$(date +"%Y-%m-%d %H:%M:%S")
echo "$timestamp: START" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
# Ensure the file path is passed as an argument
if [ "$#" -lt 1 ]; then
    echo "  Usage: $0 <path_to_pdf>" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut' 2>&1
    exit 1
fi

PDF_PATH="$1"
DEBUG="$2"
DESTINATION_PATH="/Library/FileMaker Server/HTTPServer/htdocs/httpsRoot/images"

echo "  : PDF_PATH: $PDF_PATH" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
echo "  : DEBUG: $DEBUG" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'

# Move the file
chmod u+rw "$PDF_PATH"
if [ $? -ne 0 ]; then
    echo "  : Failed to change file permissions." >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    exit 1
fi
if mv "$PDF_PATH" "$DESTINATION_PATH"; then
    echo "  : File moved successfully." >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    
    # If debug is set, move the file back
    if [ "$DEBUG" == "1" ]; then
        mv "$DESTINATION_PATH/$(basename "$PDF_PATH")" "$PDF_PATH"
        echo "  : File returned due to debug mode." >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    fi
else
    # Capture the last error message
    errorMessage=$?

    echo "  : Failed to move file. Error code: $errorMessage" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    exit 1
fi
echo "$timestamp: END" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'