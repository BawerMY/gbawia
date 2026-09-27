# GBAWIA - Shared Freight Network

## 1. L'Idea di Business (Overview)
**GBAWIA** è un'idea di business in ambito digitale e mobilità: un'app/sito web basato sul funzionamento di **"FlixBus", ma applicato al trasporto merci**. 

* **Target Clienti:** Piccole e medie imprese (PMI) e clienti privati con un budget limitato.
* **Concetto Base:** Il cliente porta la sua merce in un magazzino in comune (Hub) e paga *solo per lo spazio effettivamente occupato*. 
* **Esecuzione:** La merce viene caricata su mezzi di trasporto (autocarri in subappalto). Il mezzo parte solo quando raggiunge una soglia di riempimento economicamente efficiente ed entro un tempo massimo garantito. Questo garantisce che il mezzo viaggi sempre a pieno carico (o quasi), permettendo di abbattere i costi. Come per FlixBus (sali e scendi), lo stesso spazio viene continuamente occupato da prodotti diversi lungo la tratta.

---

## 2. Analisi del Mercato: Problema e Soluzione
La piattaforma risolve specifiche inefficienze del mercato logistico attuale:

| ⚠️ Criticità Identificata | 💡 Bisogno Soddisfatto | 🚛 Risposta della Piattaforma (GBAWIA) |
| :--- | :--- | :--- |
| **Spazio inutilizzato nei camion** | Ottimizzazione della Capacità | Spazio condiviso *pay-per-use* |
| **Costi sproporzionati per lotti parziali** | Proporzionalità Economica | Distribuzione dei costi del viaggio tra più utenti |
| **Complessità organizzativa e preventivi lenti** | Semplificazione e Velocità Digitale | Prenotazione istantanea e algoritmo di matching da app |
| **Assenza di soluzioni per carichi intermedi** | Modularità del Servizio | Alternativa ibrida tra corriere e camion dedicato |
| **Inefficienza ambientale e $\text{CO}_2$** | Sostenibilità ed Eco-Efficienza | Massimizzazione della saturazione del mezzo prima della partenza |

---

## 3. Il Modello Operativo (Hub-to-Hub)
Il modello *Hub-to-Hub* con drop-off in magazzino funziona esattamente come una linea di autobus o treni per passeggeri. Invece di far uscire un camion appositamente per ritirare la merce a domicilio, è il cliente a recarsi al punto di raccolta principale.

### Come funziona nella pratica:
1. **Drop-off (Deposito):** Il cliente porta il pacco/bancale al magazzino di partenza più vicino (**Hub A**).
2. **Tratta principale:** GBAWIA carica la merce insieme a quella di tanti altri clienti su un unico grande camion, riempiendolo e facendolo viaggiare fino al magazzino della città di destinazione (**Hub B**).
3. **Ritiro:** Il destinatario va a ritirare la merce direttamente all'**Hub B**.

### Perché si risparmia (L'effetto "FlixBus"):
* **Eliminazione del "First Mile" e "Last Mile":** Andare a ritirare i singoli pacchi casa per casa e consegnarli porta a porta sono le fasi più costose. Togliendole, il costo crolla.
* **Massima Saturazione:** Consolidando tutto in un unico punto, i camion partono sempre a pieno carico, dividendo le spese tra decine di spedizionieri.
* **Flessibilità Opzionale:** Il "pickup a domicilio" rimane disponibile come *servizio aggiuntivo a pagamento* (Premium) per chi preferisce la comodità.

---

## 4. Analisi Competitiva

### GBAWIA vs. Crowdshipping
Spesso si confonde questo modello con il crowdshipping. Ecco perché sono diversi:

| 🚗 Crowdshipping | 🏢 Piattaforma GBAWIA |
| :--- | :--- |
| Utilizza viaggiatori/conducenti che effettuano già un tragitto | Utilizza trasporti organizzati dalla piattaforma |
| Il trasporto dipende dai viaggi disponibili | Il trasporto viene programmato |
| Capacità molto variabile | Capacità relativamente prevedibile |
| Modello peer-to-peer / decentralizzato | Modello logistico centralizzato |
| Il viaggio esiste già | Il viaggio viene organizzato sulla base della domanda |

### GBAWIA vs. Corrieri Tradizionali (es. DHL, BRT)
GBAWIA non compete come un semplice corriere tradizionale, ma si basa sulla *condivisione programmata della capacità*.

| 📦 Trasporto Tradizionale | 🚀 La tua Piattaforma (GBAWIA) |
| :--- | :--- |
| Spedizione organizzata dal cliente verso un operatore | Spazio di carico prenotabile tramite app |
| Prezzo legato a una tariffa di spedizione fissa | Prezzo basato su spazio/volume/peso e tratta |
| Rete logistica tradizionale | Rete di trasporto condiviso |
| Il cliente spesso non conosce l'effettivo utilizzo del mezzo | Obiettivo di mantenere costantemente alta l'occupazione |
| Ritiro/consegna secondo il servizio scelto | Consegna al tuo hub oppure ritiro "premium" (a pagamento) |
| Processo spesso frammentato | Processo digitale end-to-end |

---

## 5. Il Vero Vantaggio Competitivo
Il vantaggio competitivo di GBAWIA si costruisce su quattro pilastri fondamentali:

1. **Aggregazione della domanda (Effetto Network)**
   * *Ciclo virtuoso:* Più utenti usano la piattaforma ➔ più merci raccolte ➔ migliore utilizzo dei mezzi ➔ prezzi più competitivi ➔ maggiore attrattività ➔ più utenti.
2. **Algoritmo di ottimizzazione**
   * Il vero asset tecnologico. Il sistema decide: quali merci viaggiano insieme, quale camion usare, percorso, punti di carico/scarico, spazio residuo e timing per raggiungere la soglia di partenza.
3. **Prezzo Trasparente**
   * Modello: `Prezzo = spazio occupato + distanza + servizi aggiuntivi`
   * *Trasporto Standard:* Il cliente porta la merce (prezzo basso).
   * *Pickup Premium:* Ritiro da parte della piattaforma (sovrapprezzo = seconda fonte di ricavi).
4. **Rete Logistica Proprietaria (Barriera all'ingresso)**
   * Crescendo da pochi magazzini a centinaia di combinazioni origine/destinazione, la rete fisica unita a quella digitale diventa difficilmente replicabile dai nuovi entranti.

> **Value Proposition:** 
> *"Trasportare merci pagando per lo spazio realmente utilizzato, invece di sostenere il costo di capacità inutilizzata."*

---

## 6. Come Funziona Concretamente (User Journey)
1. **Inserimento Dati:** Il cliente inserisce origine, destinazione, data/finestra temporale, tipo di merce, numero di colli, peso e dimensioni.
2. **Preventivo Istantaneo:** L'app calcola il prezzo (tratta + spazio + caratteristiche + extra).
3. **Prenotazione:** Il cliente seleziona la tratta disponibile e prenota lo spazio.
4. **Consegna al Deposito:** 
   * *Opzione A (Standard):* Il cliente porta la merce all'Hub.
   * *Opzione B (Premium):* Il cliente paga un sovrapprezzo per il ritiro a domicilio.
5. **Consolidamento & Partenza:** La piattaforma aggrega spedizioni compatibili. Raggiunta la soglia di riempimento, il mezzo parte.
6. **Consegna Finale:** La merce viene scaricata negli hub lungo la tratta fino a destinazione.

---

## 7. Business Model Canvas (Estratto)

* **Customer Segments (Segmenti di Clientela):**
  * PMI
  * Aziende manifatturiere
  * Produttori
  * E-commerce
  * Artigiani
  * Privati con merci ingombranti

* **Value Proposition (Proposta di Valore):**
  * Trasporto merci più accessibile e semplice attraverso la condivisione dello spazio sui mezzi di trasporto.

* **Channels (Canali):**
  * App
  * Sito web
  * Partnership con aziende