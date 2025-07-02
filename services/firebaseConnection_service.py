import firebase_admin
from firebase_admin import credentials, firestore
from controllers.log_controller import log

def connectionToFirebase():
    #Intialize with the API key [JSON File] generated inside the Firebase Database
    log.info("firebaseConnection_service: Connecting to Firebase and its collections [DB]")
    credential = credentials.Certificate("config/serviceAccountKey.json")

    firebase_admin.initialize_app(credential)

    #Path inside Firebase Realtime Database where the data is stored - '/' indicates that it will get everything
    firebase_path = "/"

    # Initialize Firestore client and sets the Collection Name
    db = firestore.client()

    #List of collections on Firebase
    collections = ["inspecoes", "users", "subestacoes", "equipamentos"]