from controllers.dataGet_controller import loopColections
from controllers.log_controller import log
from controllers.dataProcessing_controller import gSheets

#Running Main
log.info("Running Main")
if __name__ == "__main__":
    #Calling loopColections function from controllers.dataGet_controller
    log.info("Main: Calling dataGet_controller")
    #loopColections()  

    #Calling gSheets function from controllers.dataProcessing_controller
    log.info("Main: Calling dataProcessing_controller")
    gSheets()