import gspread
from oauth2client.service_account import ServiceAccountCredentials
from controllers.log_controller import log
from controllers.dataGet_controller import loopColections

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

        #Adds headers
        log.info("dataProcessing_controller: Adding headers to the spreasheet by getting the first index [0]")
        headers = list(allDataToExport[0].keys()) # Gets the keys from the first item to use it as headers (ex: "equipamento", "status")
        sheet.append_row(headers) #Adds headers as the first row

        #Writing data into the spreadsheet[row by row]
        log.info("dataProcessing_controller: Writing data")
        for item in allDataToExport:
            log.info(f"dataProcessing_controller: Adding row -> {item}")
            print(f"dataProcessing_controller: Adding row -> {item}")
            sheet.append_row([item[key] for key in headers]) #Adds a new row in the sheet with the values from that item (matching the header order).
    except Exception as e:
        log.error(f"dataProcessing_controller: error trying to either fetch data from Firebase or sending it to Google Sheets -> {e}")
