from services.firebaseConnection_service import connectionToFirebase
from controllers.log_controller import log

#Running Main
log.info("Running Main")
if name == "main":
    #Calling connectionToFireBase function from services.firebaseConnection_service
    log.info("Main: Calling connectionToFireBase")
    connectionToFirebase()
