import gspread
from oauth2client.service_account import ServiceAccountCredentials
from controllers.log_controller import log
from controllers.dataGet_controller import loopColections

def EvenItems(item):
    #Converts dicts and lists into clean strings for Google Sheets.
    flattened = {}

    for key, value in item.items():
        if isinstance(value, list) and all(isinstance(i, dict) for i in value):
            #Format list of dicts like: item = resposta; item = resposta
            flattened[key] = "; ".join(
                f"{d.get('item', '')} = {d.get('resposta', '')}" for d in value
            )
        elif isinstance(value, (dict, list)):
            #General fallback for unexpected complex types
            flattened[key] = str(value)
        else:
            flattened[key] = value

    return flattened


def gSheets():
    #Try/Except to connect to GSheets
    try:
        #Defines the scope of API from Google Sheets
        log.info("dataProcessing_controller: Initializing data processing to send to Google Sheets")
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]  

        #Authenticated with the JSON file
        log.info("dataProcessing_controller: Authentication to Google with the JSON file downloaded")
        creds = ServiceAccountCredentials.from_json_keyfile_name("config/credentialsGoogle.json", scope)
        client = gspread.authorize(creds)

        #Opens sheet by name 
        log.info("dataProcessing_controller: Opening spreadsheet and accessing sheet1")
        sheet = client.open("PlanilhaTeste").sheet1  #sheet1 is the default first spreadsheet
    except Exception as e:
        log.error(f"dataProcessing_controller: error in connecting to Google SpreadSheet -> {e}")
    
    #Try/Except to get and send data
    try:
        #Get all data exported from loopColections, and if it doesn't have anything in it, log a warning
        allDataToExport = loopColections()
        if not allDataToExport:
            log.warning("dataProcessing_controller: No data to write to sheet")
            return


        #Calls function to flatten first item to get header keys
        log.info("dataProcessing_controller: Adding headers to the spreasheet by getting the first index [0]")
        first_flat = EvenItems(allDataToExport[0])
        headers = list(first_flat.keys())        
        sheet.append_row(headers) #Adds headers as the first row

        #Writing data into the spreadsheet[row by row]
        log.info("dataProcessing_controller: Writing data")
        for item in allDataToExport:
            cleanedUpItem = EvenItems(item)
            row = [cleanedUpItem.get(key, "") for key in headers]
            sheet.append_row(row)
            log.info(f"dataProcessing_controller: Adding row -> {cleanedUpItem}")            
            print(f"dataProcessing_controller: Adding row -> {cleanedUpItem}")

    except Exception as e:
        log.error(f"dataProcessing_controller: error trying to either fetch data from Firebase or sending it to Google Sheets -> {e}")
