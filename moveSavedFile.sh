#!/bin/bash

# Script to move a PDF from a temporary location to the web server's image folder

# Variables
timestamp=$(date +"%Y-%m-%d %H:%M:%S")
echo "$timestamp: START" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
# Ensure there is an argument
if [ "$#" -lt 1 ]; then
    echo "  Usage: $0 <path_to_pdf>" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut' 2>&1
    echo "$timestamp: END" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    exit 1
fi

PDF_PATH="$1"
echo "  : PDF_PATH: $PDF_PATH" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
if [ "$PDF_PATH" == "undefined" ]; then
    echo "  : PDF_PATH: Cannot be Empty" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    echo "$timestamp: END" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    exit 1
fi
DEBUG="$2"
echo "  : DEBUG: $DEBUG" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
DESTINATION_PATH="/Library/FileMaker Server/HTTPServer/htdocs/httpsRoot/images"

if mv "$PDF_PATH" "$DESTINATION_PATH"; then
    echo "  : File moved successfully." >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    
    # If debug is set, move the file back
    if [ "${DEBUG:-0}" == "1" ]; then
        mv "$DESTINATION_PATH/$(basename "$PDF_PATH")" "$PDF_PATH"
        echo "  : File returned due to debug mode." >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    fi
else
    # Capture the last error message
    errorMessage=$(mv "$PDF_PATH" "$DESTINATION_PATH" 2>&1)

    echo "  : Failed to move file. Error code: $errorMessage" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    echo "$timestamp: END" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'
    exit 1
fi
echo "$timestamp: END" >> '/Library/FileMaker Server/Data/Documents/moveFileStdOut'