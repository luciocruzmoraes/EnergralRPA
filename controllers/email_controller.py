from controllers.log_controller import log
from security import email_address, app_password 
from email.mime.multipart import MIMEMultipart #cria um e-mail com várias partes (texto, anexo, etc.).
from email.mime.text import MIMEText #cria a parte de texto do e-mail.
import smtplib # envia e-mails usando protocolo SMTP (como o do Gmail).

def sendEmail_Critical(item):
    print("Entrei na func")
    msg = MIMEMultipart()
    msg['From'] = email_address
    msg['To'] = 'kleberjgrandolffi@gmail.com'
    msg['Cc'] = 'luisfelipespessoto@gmail.com'
    msg['Subject'] = 'Falha critica em Campo'
    message = f"""⚠️ FALHA CRÍTICA DETECTADA ⚠️

    📅 Data: {item.get('data', 'N/A')}
    👤 Usuário: {item.get('usuario', 'N/A')}
    📍 Localização: {item.get('localizacao', 'N/A')}
    🔧 Equipamento: {item.get('equipamento', 'N/A')}
    🆔 ID da inspeção: {item.get('id', 'N/A')}
    📌 Status: {item.get('status', 'N/A')}
    🗒️ Observação: {item.get('observacao', '(nenhuma)')}
    """
    msg.attach(MIMEText(message, 'plain')) #anexa o corpo à mensagem.
    destinatarios = [msg['To']] + [msg['Cc']]


    try:
        mailserver = smtplib.SMTP('smtp.gmail.com',587) #Abre conexão com o Gmail (smtp.gmail.com) na porta 587.
        mailserver.ehlo() # se identifica com o servidor

        mailserver.starttls() # ativa criptografia.

        mailserver.ehlo() # novamente: reafirma a identidade já criptografada.

        mailserver.login(email_address, app_password)

        mailserver.sendmail(msg['From'], destinatarios, msg.as_string()) #Envia o e-mail do remetente para o destinatário com o conteúdo (msg.as_string() converte tudo para texto puro do e-mail).

        mailserver.quit()
        log.info("E-mail crítico enviado com sucesso.")
        print("E-mail crítico enviado com sucesso.")
    except Exception as e:
         log.error(f"Erro ao enviar e-mail crítico: {e}")
         print(f"Erro ao tentar enviar e-mail: {e}")


    return 
