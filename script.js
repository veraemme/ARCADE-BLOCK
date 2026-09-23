// --- VARIABILI DI GIOCO ---
const DIMENSIONE = 8;
let griglia = [];
let punteggio = 0;
let record = localStorage.getItem('arcadeRecord') || 0;
let formaSelezionata = null;

const colori = ['#ff0000', '#00ff00', '#fce803', '#ff9900', '#00ffff', '#ff00ff'];

const modelliFormeNormali = [
    [[1,1],[1,1]], // Quadrato
    [[1,1,1,1]], // Linea
    [[1],[1],[1],[1]], // Colonna
    [[1,1,1],[1,0,0]], // L
    [[1,1,1],[0,1,0]], // T
    [[1]] // Punto singolo
];

const modelloBomba = [[2]]; 

let draggingElement = null;
let offsetX = 0;
let offsetY = 0;
let originalParent = null;

function avviaSchermata() {
    document.getElementById('high-score').innerText = record;
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    punteggio = 0;
    aggiornaPunteggio(0);
    creaGriglia();
    generaForme();
}

function showStartScreen() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
}

function creaGriglia() {
    const gridDiv = document.getElementById('grid');
    gridDiv.innerHTML = '';
    griglia = Array(DIMENSIONE).fill().map(() => Array(DIMENSIONE).fill(0));
    
    for (let r = 0; r < DIMENSIONE; r++) {
        for (let c = 0; c < DIMENSIONE; c++) {
            const cella = document.createElement('div');
            cella.classList.add('cell');
            cella.dataset.r = r;
            cella.dataset.c = c;
            gridDiv.appendChild(cella);
        }
    }
}

function generaForme() {
    const contenitore = document.getElementById('shapes-container');
    contenitore.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        let modello, colore;
        
        let probabilitaBomba = (punteggio >= 300) ? 0.10 : 0; 
        
        if (Math.random() < probabilitaBomba) {
            modello = modelloBomba;
            colore = '#000000'; 
        } else {
            let indiceCasuale = Math.floor(Math.random() * modelliFormeNormali.length);
            modello = modelliFormeNormali[indiceCasuale];
            colore = colori[Math.floor(Math.random() * colori.length)];
        }
        
        creaElementoForma(modello, colore, contenitore);
    }
}

function creaElementoForma(modello, colore, contenitore) {
    const divForma = document.createElement('div');
    divForma.classList.add('shape');
    divForma.style.gridTemplateColumns = `repeat(${modello[0].length}, 20px)`;
    
    divForma.style.touchAction = 'none'; 
    divForma.modello = modello;
    divForma.colore = colore;
    
    modello.forEach(riga => {
        riga.forEach(blocco => {
            const quadratino = document.createElement('div');
            quadratino.style.width = '20px';
            quadratino.style.height = '20px';
            
            if (blocco > 0) {
                quadratino.style.background = colore;
                quadratino.classList.add('filled');
                
                if (blocco === 2) {
                    quadratino.innerText = 'B';
                    quadratino.style.color = '#ff0000';
                    quadratino.style.display = 'flex';
                    quadratino.style.alignItems = 'center';
                    quadratino.style.justifyContent = 'center';
                    quadratino.style.fontSize = '14px';
                }
            }
            divForma.appendChild(quadratino);
        });
    });

    divForma.addEventListener('mousedown', startDrag);
    divForma.addEventListener('touchstart', startDrag, { passive: false });
    
    contenitore.appendChild(divForma);
}

// --- TRASCINAMENTO REALE 1:1 ---
function startDrag(e) {
    if (e.type === 'touchstart') e.preventDefault(); 
    
    draggingElement = this;
    originalParent = draggingElement.parentElement;
    
    formaSelezionata = {
        modello: draggingElement.modello,
        colore: draggingElement.colore,
        elemento: draggingElement
    };

    let clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    let clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    // CALCOLO ESATTO 1:1 DEL PUNTO DI PRESA
    const rect = draggingElement.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    draggingElement.style.position = 'fixed';
    draggingElement.style.zIndex = '1000';
    draggingElement.style.pointerEvents = 'none'; 
    draggingElement.style.margin = '0'; // Evita scatti improvvisi
    draggingElement.style.transform = 'scale(1)'; // Mantiene la grandezza reale per allinearsi perfettamente
    
    let blockLeft = clientX - offsetX;
    let blockTop = clientY - offsetY;
    
    draggingElement.style.left = blockLeft + 'px';
    draggingElement.style.top = blockTop + 'px';
    
    document.body.appendChild(draggingElement);
    
    if (e.type.includes('touch')) {
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);
    } else {
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
    }
}

function drag(e) {
    if (!draggingElement) return;
    if (e.type === 'touchmove') e.preventDefault(); 

    let clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    let clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    // Ricalcola la posizione esatta 1:1
    let blockLeft = clientX - offsetX;
    let blockTop = clientY - offsetY;

    draggingElement.style.left = blockLeft + 'px';
    draggingElement.style.top = blockTop + 'px';

    // Prende il punto ESATTO sotto il blocco (l'angolo in alto a sinistra)
    const elementoSotto = document.elementFromPoint(blockLeft + 10, blockTop + 10);

    if (elementoSotto && elementoSotto.classList.contains('cell')) {
        const r = parseInt(elementoSotto.dataset.r);
        const c = parseInt(elementoSotto.dataset.c);
        mostraAnteprima(r, c);
        draggingElement.dataset.targetR = r;
        draggingElement.dataset.targetC = c;
    } else {
        rimuoviAnteprima();
        draggingElement.dataset.targetR = "";
        draggingElement.dataset.targetC = "";
    }
}

function endDrag(e) {
    if (!draggingElement) return;

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', endDrag);

    const r = draggingElement.dataset.targetR;
    const c = draggingElement.dataset.targetC;
    let piazzato = false;

    if (r !== "" && c !== "" && r !== undefined && c !== undefined) {
        piazzato = tentaPiazzamento(parseInt(r), parseInt(c));
    }

    if (!piazzato) {
        draggingElement.style.position = 'static';
        draggingElement.style.zIndex = 'auto';
        draggingElement.style.pointerEvents = 'auto'; 
        originalParent.appendChild(draggingElement);
        
        const gridDiv = document.getElementById('grid');
        gridDiv.classList.add('shake');
        setTimeout(() => gridDiv.classList.remove('shake'), 200);
    }

    rimuoviAnteprima();
    if (draggingElement) {
        draggingElement.dataset.targetR = "";
        draggingElement.dataset.targetC = "";
    }
    draggingElement = null;
    formaSelezionata = null;
}

// --- ANTEPRIMA E INCASTRO ---
function mostraAnteprima(rigaPartenza, colPartenza) {
    if (!formaSelezionata) return;
    rimuoviAnteprima();
    const { modello } = formaSelezionata;
    let puoPiazzare = true;

    for (let r = 0; r < modello.length; r++) {
        for (let c = 0; c < modello[r].length; c++) {
            if (modello[r][c] > 0) {
                let rTarget = rigaPartenza + r;
                let cTarget = colPartenza + c;
                if (rTarget >= DIMENSIONE || cTarget >= DIMENSIONE || griglia[rTarget][cTarget] !== 0) {
                    puoPiazzare = false;
                }
            }
        }
    }

    for (let r = 0; r < modello.length; r++) {
        for (let c = 0; c < modello[r].length; c++) {
            if (modello[r][c] > 0) {
                let rTarget = rigaPartenza + r;
                let cTarget = colPartenza + c;
                if (rTarget < DIMENSIONE && cTarget < DIMENSIONE) {
                    const cellaTarget = document.querySelector(`.cell[data-r="${rTarget}"][data-c="${cTarget}"]`);
                    if (cellaTarget && griglia[rTarget][cTarget] === 0) {
                        cellaTarget.classList.add(puoPiazzare ? 'preview' : 'preview-error');
                    }
                }
            }
        }
    }
}

function rimuoviAnteprima() {
    document.querySelectorAll('.preview, .preview-error').forEach(c => {
        c.classList.remove('preview', 'preview-error');
    });
}

function tentaPiazzamento(rigaPartenza, colPartenza) {
    const { modello, colore, elemento } = formaSelezionata;
    let puoPiazzare = true;

    for (let r = 0; r < modello.length; r++) {
        for (let c = 0; c < modello[r].length; c++) {
            if (modello[r][c] > 0) {
                let rTarget = rigaPartenza + r;
                let cTarget = colPartenza + c;
                if (rTarget >= DIMENSIONE || cTarget >= DIMENSIONE || griglia[rTarget][cTarget] !== 0) {
                    puoPiazzare = false;
                }
            }
        }
    }

    if (puoPiazzare) {
        if (modello[0][0] === 2) {
            esplosioneBomba(rigaPartenza, colPartenza);
        } else {
            for (let r = 0; r < modello.length; r++) {
                for (let c = 0; c < modello[r].length; c++) {
                    if (modello[r][c] > 0) {
                        griglia[rigaPartenza + r][colPartenza + c] = colore;
                    }
                }
            }
        }

        aggiornaPunteggio(10);
        disegnaGriglia();
        elemento.remove();
        controllaLinee();

        if (document.getElementById('shapes-container').children.length === 0) generaForme();
        return true;
    }
    return false;
}

function disegnaGriglia() {
    const celle = document.querySelectorAll('.cell');
    celle.forEach(cella => {
        let r = parseInt(cella.dataset.r);
        let c = parseInt(cella.dataset.c);
        if (griglia[r][c] !== 0) {
            cella.style.background = griglia[r][c];
            cella.classList.add('filled');
        } else {
            cella.style.background = 'rgba(255, 255, 255, 0.1)';
            cella.classList.remove('filled');
        }
    });
}

function controllaLinee() {
    let righeDaCancellare = [];
    let colDaCancellare = [];

    for (let r = 0; r < DIMENSIONE; r++) {
        if (griglia[r].every(cella => cella !== 0)) righeDaCancellare.push(r);
    }
    for (let c = 0; c < DIMENSIONE; c++) {
        let colonnaPiena = true;
        for (let r = 0; r < DIMENSIONE; r++) {
            if (griglia[r][c] === 0) colonnaPiena = false;
        }
        if (colonnaPiena) colDaCancellare.push(c);
    }

    let puntiExtra = 0;
    righeDaCancellare.forEach(r => {
        for (let c = 0; c < DIMENSIONE; c++) {
            griglia[r][c] = 0;
            animaCella(r, c);
        }
        puntiExtra += 100;
    });
    colDaCancellare.forEach(c => {
        for (let r = 0; r < DIMENSIONE; r++) {
            griglia[r][c] = 0;
            animaCella(r, c);
        }
        puntiExtra += 100;
    });

    if (puntiExtra > 0) {
        setTimeout(disegnaGriglia, 300);
        aggiornaPunteggio(puntiExtra);
    }
}

function esplosioneBomba(rCentrale, cCentrale) {
    for(let r = -1; r <= 1; r++) {
        for(let c = -1; c <= 1; c++) {
            let tr = rCentrale + r;
            let tc = cCentrale + c;
            if(tr >= 0 && tr < DIMENSIONE && tc >= 0 && tc < DIMENSIONE) {
                if(griglia[tr][tc] !== 0) aggiornaPunteggio(20);
                griglia[tr][tc] = 0;
                animaCella(tr, tc);
            }
        }
    }
    setTimeout(disegnaGriglia, 300);
}

function animaCella(r, c) {
    const cella = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    cella.classList.add('esplosione');
    setTimeout(() => cella.classList.remove('esplosione'), 300);
}

function aggiornaPunteggio(punti) {
    punteggio += punti;
    document.getElementById('score').innerText = punteggio;
    if (punteggio > record) {
        record = punteggio;
        localStorage.setItem('arcadeRecord', record);
        document.getElementById('high-score').innerText = record;
    }
}

function joinGroup() {
    alert("Funzione Multiplayer Online in arrivo! Intanto allenati per battere il record locale.");
}

avviaSchermata();
