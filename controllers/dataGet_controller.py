from controllers.log_controller import log
from services.firebaseConnection_service import initializeFirebase, getDB, getCollectionsList

def loopColections():
    #Ensure Firebase is already initialized before proceeding
    initializeFirebase() 
    
    collectionsList = getCollectionsList() #Get list of collections    
    
    #Initializing an empty list
    allDataToExport = []
    
    log.info(f"dataGet_controller: Looping through collections")
    for collectionName in collectionsList: # Iterate through the collection names
        print(f"\n- Collection {collectionName} -\n")
        try:
            data = getData(collectionName)
            print(f"inside loopColections data: {data}")
            for i in data:
                i['collection'] = collectionName
                allDataToExport.append(i)
        except Exception as e:
            log.error(f"dataGet_controller: Error fetching data for collection {collectionName} -> {e}")
            
    return allDataToExport  


def getData(collectionName):
    log.info(f"dataGet_controller: Fetching data from collection -> {collectionName}")
    
    # Get the Firestore database object 
    db = getDB()    

    dataExtracted_Rough = db.collection(collectionName).stream()
    dataDicio = []
    itemCount = 0 # To log how many items are found
    log.info("dataGet_controller: starting loop for each item in the collection to append to dataDicio")
    for item in dataExtracted_Rough:
        itemCount += 1
        record = item.to_dict() # Converts firebase document 
        print(f"record {record}")
        record['id'] = item.id  # Include Firestore document ID to item
        print(f"record['id'] {record['id']}")
        dataDicio.append(record) # Appends items to dictionary
        print(f"\nDicio dentro dataGet = {dataDicio}\n")

    log.info(f"dataGet_controller: Collection '{collectionName}' submited {itemCount} documents.")
    
    return dataDicio