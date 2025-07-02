from controllers.dataGet_controller import loopColections
from controllers.log_controller import log

#Running Main
log.info("Running Main")
if __name__ == "__main__":
    #Calling loopColections function from controllers.dataGet_controller
    log.info("Main: Calling dataGet_Controller")
    loopColections()  