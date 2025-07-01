import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import logging as log
log.basicConfig(level=log.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        log.FileHandler('app.txt') # Outputs to the file app.txt
                    ])


#Intialize with the API key [JSON File] generated inside the Firebase Database
log.info("Conection to Firebase and its collections [DB]")
credential = credentials.Certificate("serviceAccountKey.json")

firebase_admin.initialize_app(credential)

#Path inside Firebase Realtime Database where the data is stored - '/' indicates that it will get everything
firebase_path = "/"

# Initialize Firestore client and sets the Collection Name
db = firestore.client()

#List of collections on Firebase
collections = ["inspecoes", "users", "subestacoes", "equipamentos"]


#Function that will read and retrieve the data from the DB 
def getData(collectionName):
    log.info("Fetching data from collection: {collectionName}")
    
    dataExtracted_Rough = db.collection(collectionName).stream()
    
    dataDicio = []
    for item in dataExtracted_Rough:
        record = item.to_dict() # Converts firebase document 
        record['id'] = item.id  # Include Firestore document ID to item
        dataDicio.append(record) # Appends items to dictionary

    return dataDicio
    
#Function that will convert the data from the JSON extracted into an Excel file
def convertDataToExcel():
    return

#Function that will send an email immediately after a 'FAIL' is read from the extracted data
def sendEmail_Fail():
    return


def main():
    log.info("- Main Starting -")

    print(getData(collections[1]))


    
    print(collections)
    
#Calls main function 
if __name__ == "__main__":
    main()
  