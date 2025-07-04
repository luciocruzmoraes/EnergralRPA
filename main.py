from controllers.log_controller import log
from controllers.dataProcessing_controller import gSheets
import schedule
import time

def runMainTask():
    #Calling gSheets function from controllers.dataProcessing_controller
    log.info("Main: Calling dataProcessing_controller")
    log.info("Main: runMainTask [scheduled run]")
    print("Main: schedulerRunTime - Run to start the loop [20 seconds loop]")
    gSheets()



#Running Main
log.info("Running Main")
if __name__ == "__main__":
    runMainTask()
    
    #Set job to run every 20 seconds
    schedule.every(20).seconds.do(runMainTask)
    log.info("Main: schedulerRunTime - First run to start the loop every 20 seconds")

    
    #Infinite loop so it runs forever
    while True:
        schedule.run_pending()
        time.sleep(1)



