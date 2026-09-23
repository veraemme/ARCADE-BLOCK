// --- VARIABILI DI GIOCO ---
const DIMENSIONE = 8;
let griglia = [];
let punteggio = 0;
let record = localStorage.getItem('arcadeRecord') || 0;
let formaSelezionata = null;

const colori = ['#ff0000', '#00ff00', '#fce803', '#ff9900', '#00ffff', '#ff00ff'];

// 1: blocco normale, 2: Bomba speciale
const modelliForme = [
    [[1,1],[1,1]], // Quadrato
    [[1,1,1,1]], // Linea
    [[1],[1],[1],[1]], // Colonna
    [[1,1,1],[1,0,0]], // L
    [[1,1,1],[0,1,0]], // T
    [[1]], // Punto singolo
    [[2]] // BLOCCO SPECIALE (Bomba)
];

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
            
            // Clic per piazzare
            cella.addEventListener('click', () => piazzaForma(r, c));
            
            // Mouse sopra per l'ombra (anteprima)
            cella.addEventListener('mouseover', () => mostraAnteprima(r, c));
            cella.addEventListener('mouseout', rimuoviAnteprima);
            
            gridDiv.appendChild(cella);
        }
    }
}

function generaForme() {
    const contenitore = document.getElementById('shapes-container');
    contenitore.innerHTML = '';
    formaSelezionata = null;

    for (let i = 0; i < 3; i++) {
        let indiceCasuale = Math.floor(Math.random() * modelliForme.length);
        let modello = modelliForme[indiceCasuale];
        let colore = colori[Math.floor(Math.random() * colori.length)];
        if (modello[0][0] === 2) colore = '#ffffff'; // La bomba è bianca
        creaElementoForma(modello, colore, contenitore);
    }
}

function creaElementoForma(modello, colore, contenitore) {
    const divForma = document.createElement('div');
    divForma.classList.add('shape');
    divForma.style.gridTemplateColumns = `repeat(${modello[0].length}, 20px)`;
    
    modello.forEach(riga => {
        riga.forEach(blocco => {
            const quadratino = document.createElement('div');
            quadratino.style.width = '20px';
            quadratino.style.height = '20px';
            if (blocco > 0) {
                quadratino.style.background = colore;
                quadratino.classList.add('filled');
                if (blocco === 2) quadratino.innerText = 'B';
            }
            divForma.appendChild(quadratino);
        });
    });

    // Seleziona la forma
    divForma.addEventListener('click', () => {
        document.querySelectorAll('.shape').forEach(s => s.classList.remove('selected'));
        divForma.classList.add('selected');
        formaSelezionata = { modello, colore, elemento: divForma };
    });

    contenitore.appendChild(divForma);
}

// --- LOGICA DELL'OMBRA (ANTEPRIMA) ---
function mostraAnteprima(rigaPartenza, colPartenza) {
    if (!formaSelezionata) return;
    rimuoviAnteprima();
    const { modello } = formaSelezionata;
    let puoPiazzare = true;

    // Controllo se ci sta
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

    // Disegna l'ombra bianca (o rossa se è bloccata)
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

// --- PIAZZARE LA FORMA ---
function piazzaForma(rigaPartenza, colPartenza) {
    if (!formaSelezionata) return;
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
        rimuoviAnteprima(); 
        elemento.remove();
        formaSelezionata = null;

        controllaLinee();

        if (document.getElementById('shapes-container').children.length === 0) generaForme();
    } else {
        // SE CLICCHI MALE, LA GRIGLIA VIBRA!
        const gridDiv = document.getElementById('grid');
        gridDiv.classList.add('shake');
        setTimeout(() => gridDiv.classList.remove('shake'), 200);
    }
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

// --- CONTROLLO DELLE LINEE ---
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
