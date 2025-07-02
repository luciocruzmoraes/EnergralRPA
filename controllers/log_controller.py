import logging

#Configure logging configuration and format
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler('log.txt') # Outputs to the file log.txt
                    ])


# Export the logging object
log = logging.getLogger(__name__)
