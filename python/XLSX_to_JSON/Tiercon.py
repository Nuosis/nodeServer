import re
import datetime
import logging
import os
import uuid
import json

# Configure logging
#DEBUG, INFO, WARNING, ERROR, and CRITICAL.
logging.basicConfig(filename='error_log.log', level=logging.DEBUG, 
                    format='%(asctime)s:%(levelname)s:%(message)s')
#logging.info(f"Tiercon.py: 'init'")
                    
# Get the directory of the script
base_directory = os.path.dirname(os.path.abspath(__file__))

# Define the base directory by appending 'images' to the script directory
# base_directory = os.path.join(script_directory)

def save_images_from_sheet(sheet, image_directory):
    # Combine the base directory with the specific image directory
    full_image_directory = os.path.join(base_directory, image_directory)
    #logging.debug(f"Full Image Directory: {full_image_directory}")
    
    if not os.path.exists(full_image_directory):
        os.makedirs(full_image_directory)

    image_paths = []
    logging.debug(f"Found {len(sheet._images)} images in {sheet.title}")
    for index, drawing in enumerate(sheet._images):
        # Check if the drawing object contains image data
        if hasattr(drawing, '_data'):
            image_data = drawing._data()
        elif hasattr(drawing, '_imagedata'):
            image_data = drawing._imagedata
        else:
            # Skip if no image data is found
            continue

        image_filename = f"{sheet.title}_image_{index}.png"
        image_path = os.path.join(full_image_directory, image_filename)
        logging.info(f"Saving image to: {image_path}")

        with open(image_path, "wb") as img_file:
            img_file.write(image_data)

        image_paths.append(f"./images/{image_directory}/{image_filename}")

    return image_paths

# Define extract_value at module level to avoid repetition
def extract_value(cell, label=None):
    try:
        if not cell or cell.value is None:
            return None

        # Handling strings with labels
        if isinstance(cell.value, str):
            if label:
                match = re.search(f'{label}:(.*)', cell.value)
                return match.group(1).strip() if match else None
            return cell.value.strip()

        # Handling dates
        elif isinstance(cell.value, datetime.datetime):
            return cell.value.strftime('%Y-%m-%d')  # or any format you prefer

        # Handling numbers
        elif isinstance(cell.value, (int, float)):
            return cell.value

        else:
            raise ValueError(f"Unexpected data type: {type(cell.value)} in cell {cell.coordinate}")

    except Exception as e:
        # Log or print the error message
        logging.error(f"Error processing cell {cell.coordinate}: {e}")
        return None



def extract_file_info(sheet):
    fileInfo = {
        'preparedBy': extract_value(sheet['B1'], 'Prepared By'),
        'approvedBy': extract_value(sheet['B2'], 'Approved by'),
        'revision': extract_value(sheet['L1'], 'Revision #'),
        'revisionDate': extract_value(sheet['L2'], 'Rev. Date'),
        'documentName': extract_value(sheet['Q1'], 'Document')
    }

    return fileInfo

def extract_part_info(sheet):
    partInfo = {
        'info.date': extract_value(sheet['B7']),
        'info.prgramNumber': extract_value(sheet['B9']),
        'info.modelYear': extract_value(sheet['B11']),
        'info.platformCode': extract_value(sheet['B13']),
        'info.plannedTKO': extract_value(sheet['B15']),
        'info.plannedNonSaleable': extract_value(sheet['B17']),
        'info.requestor': extract_value(sheet['N7']),
        'info.customer': extract_value(sheet['N9']),
        'info.annVolume': extract_value(sheet['N11']),
        'info.programLife': extract_value(sheet['N13']),
        'info.plannedFullPPAP': extract_value(sheet['N15']),
        'info.SORP': extract_value(sheet['N17']),

        'part[0]description': extract_value(sheet['B21']),
        'part[0]number': extract_value(sheet['N21']),
        'part[0]rev': extract_value(sheet['T21']),
        'part[1]description': extract_value(sheet['B23']),
        'part[1]number': extract_value(sheet['N23']),
        'part[1]rev': extract_value(sheet['T23']),

        'material.specification': extract_value(sheet['B27']),
        'material.nominalThickness': extract_value(sheet['P27']),

        'texture.chrome': extract_value(sheet['E31']),
        'texture.polished.y/n': extract_value(sheet['N31']),
        'texture.polished.note': extract_value(sheet['Q31']),
        'texture.grained.y/n': extract_value(sheet['N33']),
        'texture.grained.note': extract_value(sheet['Q33']),
        'texture.PPGM': extract_value(sheet['N35']),

        'tool.steel.H13': extract_value(sheet['N39']),
        'tool.steel.P20HH': extract_value(sheet['E39']),
        'tool.steel.P20': extract_value(sheet['E41']),
        'tool.steel.other.type': extract_value(sheet['N41']),
        'tool.steel.other.note': extract_value(sheet['Q41']),
        'tool.source[0]name': extract_value(sheet['C45']),
        'tool.source[0]selected': extract_value(sheet['E45']),
        'tool.source[1]name': extract_value(sheet['C47']),
        'tool.source[1]selected': extract_value(sheet['E47']),
        'tool.source[2]name': extract_value(sheet['L45']),
        'tool.source[2]selected': extract_value(sheet['N45']),
        'tool.source[3]name': extract_value(sheet['L47']),
        'tool.source[3]selected': extract_value(sheet['N47']),
        'tool.sourceNote': extract_value(sheet['Q47']),

        'mold.flow[0]name': extract_value(sheet['C51']),
        'mold.flow[0]selected': extract_value(sheet['E51']),
        'mold.flow[1]name': extract_value(sheet['C53']),
        'mold.flow[1]selected': extract_value(sheet['E53']),
        'mold.flow[2]name': extract_value(sheet['L51']),
        'mold.flow[2]selected': extract_value(sheet['N51']),
        'mold.flow[3]name': extract_value(sheet['L53']),
        'mold.flow[3]selected': extract_value(sheet['N53']),
        'mold.flowNote': extract_value(sheet['Q53']),
        'mold.details.hotRunner': extract_value(sheet['E59']),
        'mold.details.numDrops': extract_value(sheet['E61']),
        'mold.details.numGates': extract_value(sheet['E63']),
        'mold.details.SVG': extract_value(sheet['J59']),
        'mold.details.sharedManifold': extract_value(sheet['J61']),
        'mold.details.numCavities': extract_value(sheet['J63']),
        'mold.details.edgeGate': extract_value(sheet['O59']),
        'mold.details.subGate': extract_value(sheet['O61']),
        'mold.details.ejection': extract_value(sheet['O63']),
        'mold.details.hotTip': extract_value(sheet['S59']),
        'mold.details.other': extract_value(sheet['S61']),
        'mold.details.ejectionNote': extract_value(sheet['Q63']),
        'mold.details.numTryouts': extract_value(sheet['M65']),
        'mold.details.incldHomelineTrial': extract_value(sheet['M66']),

        'terms.dateRfqSubmitted': extract_value(sheet['D65']),
        'terms.dateSubmissionRequired': extract_value(sheet['D66']),
        'terms.payment': extract_value(sheet['C73']),

        'notes[0]': extract_value(sheet['B55']),
        'notes[1]': extract_value(sheet['A82']),
        'notes[2]': extract_value(sheet['A83']),
        'notes[3]': extract_value(sheet['A84']),
        'notes[4]': extract_value(sheet['A85']),
        'notes[5]': extract_value(sheet['A86']),
        'notes[6]': extract_value(sheet['A87'])
    }

    return partInfo

def extract_overlay(sheet):
    # Extracting special notes
    specialNotes = {
        'A': extract_value(sheet['T11']),
        'B': extract_value(sheet['T12']),
        'C': extract_value(sheet['T13']),
        'D': extract_value(sheet['T14']),
        'E': extract_value(sheet['T15'])
    } 

    return {
        'specialNotes': specialNotes
    }

def extract_quote_requirements(sheet):
    quoteRequirements = []
    # Start iterating from row 5
    for row in range(5, sheet.max_row + 1):
        cell_value = sheet[f'A{row}'].value
        # Check if the cell is not empty
        if cell_value is not None:
            quoteRequirements.append(cell_value)
    return quoteRequirements


def extract_data(workbook):
    #logging.info(f"Extracted data: 'init'")
    # Initialize an empty dictionary to hold all the data
    extracted_data = {}
    # Initialize an empty dictionary to hold all the data
    image_uuid = uuid.uuid4().hex[:10]
    image_directory = os.path.join('images', image_uuid)

    # A list of sheets to be extracted
    sheets_to_extract = [
        'Injection Mold SOR',
        'Product Overlay',
        'Footprint Dimensions',
        'Projected Surface Area',
        'VolumeMass',
        'Gate Start Point',
        'Special Criteria',
        'General Quote Requirements'
    ]

    # Loop through each sheet name
    for sheet_name in sheets_to_extract:
        sheet = workbook[sheet_name]

        # Depending on the sheet, we process differently
        if sheet_name == 'Injection Mold SOR':
            # Image extraction set to false, so we only extract file info
            extracted_data[sheet_name] = {
                'fileInfo': extract_file_info(sheet),
                'partInfo': extract_part_info(sheet),
                'images': []  # No images for this sheet
            }
        elif sheet_name == 'Product Overlay':
            extracted_data[sheet_name] = {
                'data': extract_overlay(sheet),
                'images': save_images_from_sheet(sheet, image_directory)
            }
        elif sheet_name == 'Footprint Dimensions':
            extracted_data[sheet_name] = {
                'data': extract_overlay(sheet),
                'images': save_images_from_sheet(sheet, image_directory)
            }
        elif sheet_name == 'Projected Surface Area':
            extracted_data[sheet_name] = {
                'data': extract_overlay(sheet),
                'images': save_images_from_sheet(sheet, image_directory)
            }
        elif sheet_name == 'VolumeMass':
            extracted_data[sheet_name] = {
                'data': extract_overlay(sheet),
                'images': save_images_from_sheet(sheet, image_directory)
            }
        elif sheet_name == 'Gate Start Point':
            extracted_data[sheet_name] = {
                'data': extract_overlay(sheet),
                'images': save_images_from_sheet(sheet, image_directory)
            }
        elif sheet_name == 'Special Criteria':
            extracted_data[sheet_name] = {
                'data': extract_overlay(sheet),
                'images': []
            }
        elif sheet_name == 'General Quote Requirements':
            extracted_data[sheet_name] = {
                'data': extract_quote_requirements(sheet),
                'images': []
            }
        else:
            # For other sheets, you will implement the specific logic needed
            # For now, we'll just set them to None
            extracted_data[sheet_name] = {
                'data': None,  # Placeholder for actual data extraction logic
                'images': []   # Placeholder for image paths if any
            }

    # Convert the extracted data to JSON string
    json_data = json.dumps(extracted_data, indent=4)

    # Log the return value
    logging.info(f"Extracted data: 'data returned'")

    return json_data

