import firebase_admin
from firebase_admin import credentials, firestore
import logging as log
log.basicConfig(level=log.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        log.FileHandler('app.txt') # Outputs to the file app.txt
                    ])




# 1. Carrega a credencial (arquivo JSON que seu colega vai te mandar)
cred = credentials.Certificate("config/serviceAccountKey.json")

# Inicializa o Firebase
firebase_admin.initialize_app(cred)
db = firestore.client()


def getData(collectionName):
    log.info(f"Fetching data from collection: {collectionName}")

    dataExtracted_Rough = db.collection(collectionName).stream()
    dataDicio = []
    for item in dataExtracted_Rough:
        record = item.to_dict() # Converts firebase document 
        record['id'] = item.id  # Include Firestore document ID to item
        dataDicio.append(record) # Appends items to dictionary

    return dataDicio

collections = ["inspecoes", "users", "subestacoes", "equipamentos"]



def getChecklistField():
    doc_id = 'BAKxcXqUwvaUjflxf8ZZ'
    parent_collection = 'inspecoes'

    doc_ref = db.collection(parent_collection).document(doc_id)
    doc = doc_ref.get()

    if doc.exists:
        data = doc.to_dict()

        print("📦 Documento completo:")
        for key, value in data.items():
            print(f"{key}: {value}")

            
        """checklist = data.get('checklist', [])
        print("✅ Checklist encontrado:")
        for item in checklist:
            print(item)"""
    else:
        print("❌ Documento não encontrado.")




def main():
    log.info("- Buscando campo checklist -")
    getChecklistField()



    

#Calls main function 
if __name__ == "__main__":
    main()

"""
# Cria o cliente do Firestore
db = firestore.client()

# Acessa a coleção 'inspecoes'
equipamentos = db.collection('equipamentos').stream()

for doc in equipamentos:
    print(f'{doc.id} => {doc.to_dict()}')
"""