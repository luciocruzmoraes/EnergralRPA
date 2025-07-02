import pandas as pd
from log_controller import log
import gspread 
from oauth2client import 

#Connection the Google Sheets using creadentials for a service account
log.info("dataProcessing_controller: connecting do a Google Account to access the Google Sheets")
gp = gspread.service_account(filename='config/credentialsGoogle.json')

#Connection the workbook created on the account
log.info("dataProcessing_controller: connecting to the workbook")
workbook = gp.open('')

#Get the sheet from the workbook
log.info("dataProcessing_controller: getting to the sheet from the workbook")
sheet = workbook.worksheet('')
