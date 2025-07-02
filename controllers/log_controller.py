import logging

#Configure logging configuration and format
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler('app.txt') # Outputs to the file app.txt
                    ])


# Export the logging object
log = logging.getLogger(__name__)
