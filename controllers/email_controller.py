from controllers.log_controller import log
from config.security import email_address, app_password 
from email.mime.multipart import MIMEMultipart #creates an email (text, attachment, etc.).
from email.mime.text import MIMEText #creates part of the text of the email
import smtplib #sends the email using SMTP protocol (like Gmail).

#Function to send the email
def sendEmail_Critical(item):
    log.info("email_controller: Got into the sendEmail function")
    #Setting parameters to send the email
    msg = MIMEMultipart()
    msg['From'] = email_address
    msg['To'] = 'kleberjgrandolffi@gmail.com'
    msg['Cc'] = 'luisfelipespessoto@gmail.com'
    msg['Subject'] = 'Falha critica em Campo'
    message = f"""⚠️ FALHA CRÍTICA DETECTADA ⚠️

    📅 Data: {item.get('data', 'N/A')}
    👤 Usuário: {item.get('usuario', 'N/A')}
    📍 Localização: {item.get('subestacao', 'N/A')}
    🔧 Equipamento: {item.get('equipamento', 'N/A')}
    🆔 ID de Inspeção: {item.get('id', 'N/A')}
    📌 Status: {item.get('status', 'N/A')}
    🗒️ Notas: {item.get('observacao', '(nenhuma)')}
    """

    msg.attach(MIMEText(message, 'plain')) #attaches body to message
    destinatarios = [msg['To']] + [msg['Cc']]


    try:
        mailserver = smtplib.SMTP('smtp.gmail.com',587) #Opens connection with gmail on port 587.
        mailserver.ehlo() #Verifies connection

        mailserver.starttls() #Activates cryptography

        mailserver.ehlo()

        mailserver.login(email_address, app_password)

        mailserver.sendmail(msg['From'], destinatarios, msg.as_string()) #Sends email  

        mailserver.quit()
        log.info("email_controller: Critical email sent")
        print("Email sent.")
    except Exception as e:
         log.error(f"email_controller: Error on sending critical email: {e}")
         print(f"Error on sending email: {e}")


    return 
