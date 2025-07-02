import firebase_admin
from firebase_admin import credentials, firestore
from controllers.log_controller import log

def initializeFirebase():
    #Initializes the Firebase app and returns the Firestore client.
    global db # Declare intent to modify the global db variable
    
    if not firebase_admin._apps: # Only initialize if not already initialized
        log.info("firebaseConnection_service: Initializing Firebase app.")
        try:
            credential = credentials.Certificate("config/serviceAccountKey.json")
            firebase_admin.initialize_app(credential)
            
            log.info("firebaseConnection_service: Firebase app initialized and Firestore client created.")
        except Exception as e:
            log.error(f"firebaseConnection_service: Error initializing Firebase: {e}")
            raise
    db = firestore.client()

def getDB():
    #Returns the Firestore client that was set above [the already initialized one]
    return db

def getCollectionsList():
    #Returns the predefined list of collections.
    collections = ["inspecoes", "users", "subestacoes", "equipamentos"] # Define collections here
    return collections