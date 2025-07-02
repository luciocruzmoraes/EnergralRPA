import gspread
from oauth2client.service_account import ServiceAccountCredentials
from controllers.log_controller import log
from controllers.dataGet_controller import loopColections

def gSheets():
    #Defines the scope of API from Google Sheets
    log.info("dataProcessing_controller: Initializing data processing to send to Google Sheets")
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]  

    #Authenticated with the JSON file
    log.info("dataProcessing_controller: Authentication to Google with the JSON file downloaded")
    creds = ServiceAccountCredentials.from_json_keyfile_name("config/credentialsGoogle.json", scope) #Lê seu arquivo .json da conta de serviço.
    client = gspread.authorize(creds)

    #Opens sheet by name 
    log.info("dataProcessing_controller: Opening spreadsheet and accessing sheet1")
    sheet = client.open("PlanilhaTeste").sheet1  # sheet1 é a primeira aba

    #Firebase data
    dataDicio = loopColections()
    nome = dataDicio
    print(f"\n\n\n\nDicio[0] = {nome}\n\n\n\n")
    dados = [
        nome
    ]

    #Adds headers
    log.info("dataProcessing_controller: Adding headers to the spreasheet by getting the first index [0]")
    headers = list(dados[0].keys()) # Pega as chaves do primeiro item para usar como cabeçalho da planilha (ex: "equipamento", "status").
    sheet.append_row(headers) #Adiciona isso como a primeira linha.

    #Writing data 
    log.info("dataProcessing_controller: Writing data")
    for item in dados:
        sheet.append_row(list(item.values()))

