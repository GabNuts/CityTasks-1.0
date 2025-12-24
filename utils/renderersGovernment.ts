
import * as THREE from 'three';
// Certifique-se de que 'createBox' está na lista abaixo
import { createBox, getSignMaterial, addACUnit } from './cityHelpers';
import { createDoor, createVehicle, createFlag, createGableRoof, createBush, createWindow, createFence } from './rendererHelpers';

// ... o restante das funções (renderGovPolice, etc) vem abaixo ...

export const renderGovPolice = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isV1 = variant === 1;

    // --- VARIANTES ---
    
    if (isV1) {
        // === DELEGACIA DISTRITAL (Estilo Tijolo Clássico + Garagem) ===
        const brickColor = 0x8d6e63;
        const foundationColor = 0x5d4037;
        const roofTrim = 0x4e342e;
        
        // 1. Fundação Elevada
        lot.add(createBox(3.4, 0.2, 2.8, foundationColor, 0, 0.1, -0.2, isNight));
        
        // 2. Prédio Principal (Corpo Central)
        lot.add(createBox(2.0, 1.4, 2.2, brickColor, -0.5, 0.9, -0.3, isNight));
        // Teto principal com borda
        lot.add(createBox(2.1, 0.1, 2.3, roofTrim, -0.5, 1.65, -0.3, isNight));
        
        // 3. Garagem Lateral (Anexo)
        lot.add(createBox(1.2, 1.1, 2.2, brickColor, 1.1, 0.75, -0.3, isNight));
        lot.add(createBox(1.3, 0.1, 2.3, roofTrim, 1.1, 1.35, -0.3, isNight));
        
        // Porta da Garagem (Listrada) - Recuada para dar profundidade
        const garageDoorColor = 0xcfd8dc;
        lot.add(createBox(1.0, 0.9, 0.1, garageDoorColor, 1.1, 0.65, 0.81, isNight));
        // Detalhes da porta (listras horizontais)
        for(let y=0.3; y<1.0; y+=0.2) {
            lot.add(createBox(1.0, 0.02, 0.12, 0x90a4ae, 1.1, y, 0.81, isNight));
        }

        // 4. Entrada Principal
        // Degraus
        lot.add(createBox(0.8, 0.1, 0.4, 0x9e9e9e, -0.5, 0.15, 0.9, isNight));
        lot.add(createBox(0.8, 0.1, 0.2, 0x9e9e9e, -0.5, 0.25, 1.0, isNight));
        // Porta Dupla de Vidro
        lot.add(createDoor(0.6, 0.8, -0.5, 0.7, 0.81, isNight, 0x4fc3f7));
        // Toldo sobre a porta
        lot.add(createBox(1.0, 0.05, 0.6, 0x1565c0, -0.5, 1.15, 1.1, isNight));
        // Pilares do toldo
        lot.add(createBox(0.05, 0.9, 0.05, 0xeeeeee, -0.9, 0.7, 1.3, isNight));
        lot.add(createBox(0.05, 0.9, 0.05, 0xeeeeee, -0.1, 0.7, 1.3, isNight));

        // 5. Janelas e Grades (Look de prisão nos fundos)
        // Janela lateral garagem
        lot.add(createWindow(0.6, 0.4, 1.71, 0.8, -0.3, isNight));
        (lot.children[lot.children.length-1] as THREE.Group).rotation.y = Math.PI/2;
        
        // Janelas traseiras com grades
        const backWinX = [-1.0, 0.0];
        backWinX.forEach(bx => {
            const win = createWindow(0.5, 0.5, bx, 1.0, -1.41, isNight);
            lot.add(win);
            // Grades
            lot.add(createBox(0.02, 0.5, 0.02, 0x333333, bx - 0.15, 1.0, -1.45, isNight));
            lot.add(createBox(0.02, 0.5, 0.02, 0x333333, bx, 1.0, -1.45, isNight));
            lot.add(createBox(0.02, 0.5, 0.02, 0x333333, bx + 0.15, 1.0, -1.45, isNight));
        });

        // 6. Detalhes do Telhado
        addACUnit(lot, 1.7, isNight); 
        // Ventilação extra
        lot.add(createBox(0.4, 0.3, 0.4, 0x757575, 1.1, 1.5, -0.5, isNight));
        
        // 7. Luzes de Sirene na entrada
        const lampR = createBox(0.1, 0.1, 0.1, 0xd32f2f, -0.9, 1.25, 0.8, isNight);
        const lampB = createBox(0.1, 0.1, 0.1, 0x1976d2, -0.1, 1.25, 0.8, isNight);
        if(isNight) {
             (lampR.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
             (lampB.material as THREE.MeshStandardMaterial).emissive.setHex(0x0000ff);
        }
        lot.add(lampR); lot.add(lampB);

        // Placa
        const sign = getSignMaterial('police_v1', '#0d47a1', 'POLÍCIA');
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), sign);
        signMesh.position.set(-0.5, 1.5, 0.82);
        lot.add(signMesh);

    } else {
        // === CENTRAL DE COMANDO (QG Moderno / SWAT / High-Tech) ===
        const concreteColor = 0xe0e0e0;
        const glassColor = 0x1a237e; // Vidro azul escuro espelhado
        const darkMetal = 0x37474f;

        // 1. Base Fortificada (Bunker Térreo)
        // Nota: O Bunker vai de z = -1.7 até z = 1.3
        lot.add(createBox(3.6, 1.0, 3.0, concreteColor, 0, 0.5, -0.2, isNight));
        // Faixa azul na base
        lot.add(createBox(3.65, 0.1, 3.05, 0x0d47a1, 0, 0.8, -0.2, isNight));

        // 2. Torre de Comando (Vidro e Metal)
        const towerX = 0.8;
        lot.add(createBox(1.5, 2.5, 1.5, darkMetal, towerX, 1.75, -0.5, isNight)); // Estrutura
        lot.add(createBox(1.55, 2.2, 1.2, glassColor, towerX, 1.8, -0.4, isNight)); // Fachada de vidro

        // 3. Área do Heliporto (Ala Esquerda)
        const padX = -1.0;
        // Elevando o teto para o heliporto
        lot.add(createBox(1.8, 0.2, 2.0, darkMetal, padX, 1.1, -0.2, isNight));
        
        // O "H" do Heliporto
        const padBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16),
            new THREE.MeshStandardMaterial({ color: 0x455a64 })
        );
        padBase.position.set(padX, 1.22, -0.2);
        lot.add(padBase);
        
        // H Amarelo
        lot.add(createBox(0.6, 0.02, 0.1, 0xffeb3b, padX, 1.26, -0.2, isNight));
        lot.add(createBox(0.1, 0.02, 0.6, 0xffeb3b, padX - 0.25, 1.26, -0.2, isNight));
        lot.add(createBox(0.1, 0.02, 0.6, 0xffeb3b, padX + 0.25, 1.26, -0.2, isNight));
        // Luzes de sinalização do heliporto
        [0, 90, 180, 270].forEach(deg => {
            const rad = THREE.MathUtils.degToRad(deg);
            const lx = padX + Math.cos(rad) * 0.9;
            const lz = -0.2 + Math.sin(rad) * 0.9;
            const light = createBox(0.1, 0.1, 0.1, 0xff0000, lx, 1.2, lz, isNight);
            if(isNight) (light.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
            lot.add(light);
        });

        // 4. Antena de Radar / Comunicação (Topo da Torre)
        const roofY = 3.0;
        lot.add(createBox(0.6, 0.4, 0.6, concreteColor, towerX, roofY + 0.2, -0.5, isNight));
        const dishGeo = new THREE.ConeGeometry(0.4, 0.2, 16, 1, true);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(towerX, roofY + 0.6, -0.5);
        dish.rotation.x = -Math.PI / 4;
        dish.rotation.z = -Math.PI / 4;
        lot.add(dish);
        lot.add(createBox(0.05, 1.5, 0.05, 0xb0bec5, towerX + 0.4, roofY + 0.75, -0.8, isNight));
        const blinker = createBox(0.1, 0.1, 0.1, 0xff0000, towerX + 0.4, roofY + 1.5, -0.8, isNight);
        if(isNight) (blinker.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
        lot.add(blinker);

        // 5. Guarita de Segurança e Entrada
        lot.add(createBox(0.5, 0.8, 0.5, concreteColor, 1.2, 0.4, 1.0, isNight)); // Guarita
        lot.add(createBox(0.6, 0.1, 0.6, 0x1a237e, 1.2, 0.85, 1.0, isNight)); // Teto Guarita
        lot.add(createWindow(0.4, 0.3, 1.2, 0.6, 1.26, isNight)); // Janela frontal
        
        // Cancela / Portão
        lot.add(createBox(0.1, 1.0, 0.1, 0x333333, 0.8, 0.5, 1.2, isNight)); // Poste
        lot.add(createBox(1.5, 0.05, 0.05, 0xffeb3b, 0.0, 0.8, 1.2, isNight)); // Barra Amarela
        
        // Porta principal (recuada)
        lot.add(createDoor(0.8, 0.8, towerX, 0.5, 1.26, isNight, 0x37474f));

        // Placa
        const sign = getSignMaterial('police_hq', '#1a237e', 'QG TÁTICO');
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), sign);
        signMesh.position.set(towerX, 2.2, 0.21); 
        lot.add(signMesh);
    }

    // --- ELEMENTOS COMUNS E VIATURAS ---

    // Bandeira Azul (Polícia)
    const flagX = isV1 ? 1.5 : -1.5;
    const flagZ = isV1 ? 1.2 : 1.2;
    // Usa a cor 0x1565c0 (Azul Polícia)
    lot.add(createFlag(flagX, flagZ, isNight, 0x1565c0));

    // Lógica da Viatura Rara
    if (isRare) {
        if (isV1) {
            // Delegacia V1: Viatura na rampa da garagem (fora da porta)
            // Z = 1.4 coloca o carro na frente da construção (que vai até ~0.8)
            const cruiser = createVehicle('police', 1.1, 1.4, Math.PI, isNight);
            lot.add(cruiser);
        } else {
            // Central V0: Viatura na frente do complexo
            // Z = 1.6 garante que fique fora da base do bunker (que vai até 1.3)
            const swatVan = createVehicle('police', -0.5, 1.6, -Math.PI/6, isNight);
            
            // Personalização SWAT (Escurecer a van)
            swatVan.traverse(c => {
                if(c instanceof THREE.Mesh && (c.material as THREE.MeshStandardMaterial).color.getHex() === 0xffffff) {
                    const newMat = (c.material as THREE.MeshStandardMaterial).clone();
                    newMat.color.setHex(0x455a64); // Cinza Azulado Escuro
                    c.material = newMat;
                }
            });
            lot.add(swatVan);
        }
    }
    
    // Cercas (apenas onde não bloqueiam a frente)
    if (isV1) {
        lot.add(createFence(3.8, 0.1, 0, -1.3, isNight)); // Apenas fundo
    } else {
        lot.add(createFence(3.8, 0.1, 0, -1.3, isNight)); // Fundo
        lot.add(createFence(0.1, 2.5, -1.8, 0, isNight)); // Lateral esquerda
    }
};

export const renderGovFire = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isV1 = variant === 1;

    // --- CHÃO E AMBIENTAÇÃO (Comum a ambos) ---
    // Faixas de segurança no chão (Amarelo e Preto)
    for(let i=0; i<6; i++) {
        // Amarelo na altura base 0.06
        lot.add(createBox(0.4, 0.02, 0.1, 0xffeb3b, 0.5 + (i*0.25), 0.06, 1.2, isNight)); 
        // FIX Z-FIGHTING: Preto subiu para 0.061 para ficar sobreposto ao amarelo sem piscar
        lot.add(createBox(0.4, 0.02, 0.1, 0x212121, 0.5 + (i*0.25) + 0.12, 0.061, 1.2, isNight)); 
    }

    // Caminhão de Bombeiros (APENAS SE RARO)
    if (isRare) {
        const truck = createVehicle('fire', 1.2, 1.3, -Math.PI/6, isNight);
        lot.add(truck);
    }

    // Hidrante na calçada
    const hydrantGroup = new THREE.Group();
    hydrantGroup.position.set(-1.6, 0, 1.6);
    hydrantGroup.add(createBox(0.15, 0.4, 0.15, 0xd32f2f, 0, 0.2, 0, isNight)); // Corpo
    hydrantGroup.add(createBox(0.25, 0.08, 0.08, 0xbdbdbd, 0, 0.3, 0, isNight)); // Bocas laterais
    hydrantGroup.add(createBox(0.12, 0.05, 0.12, 0xbdbdbd, 0, 0.42, 0, isNight)); // Tampa
    lot.add(hydrantGroup);

    if (isV1) {
        // === VARIANTE 1: CLÁSSICO / HISTÓRICO (Tijolos Vermelhos & Torre) ===
        const brickColor = 0xb71c1c; // Vermelho escuro
        const stoneColor = 0xe0e0e0; // Pedra clara
        const roofColor = 0x3e2723;  // Telhado escuro
        const trimColor = 0x263238;  // Metal escuro

        // 1. Bloco Principal (Garagem e Alojamento)
        // Corpo principal
        lot.add(createBox(2.8, 1.8, 2.2, brickColor, -0.2, 0.9, -0.4, isNight));
        // Base de pedra (Rodapé) - Z: -0.4, D: 2.3 -> Face frontal em 0.75. 
        // O corpo principal tem face frontal em 0.7. Sem conflito aqui.
        lot.add(createBox(2.9, 0.4, 2.3, stoneColor, -0.2, 0.2, -0.4, isNight));
        
        // 2. Portões de Garagem (Estilo Arqueado simulado)
        const gateZ = 0.71;
        for (let xPos of [-0.8, 0.4]) {
            // Buraco da porta (fundo escuro)
            lot.add(createBox(1.0, 1.2, 0.1, 0x1a1a1a, xPos, 0.6, gateZ - 0.1, isNight));
            
            // Porta vermelha enrolada
            lot.add(createBox(1.0, 1.0, 0.05, 0xd32f2f, xPos, 0.7, gateZ, isNight));
            
            // Vidros na porta
            // FIX Z-FIGHTING: Z movido de gateZ para gateZ + 0.03 (para sair da porta vermelha)
            lot.add(createBox(0.8, 0.3, 0.06, 0x81d4fa, xPos, 0.9, gateZ + 0.03, isNight));
            
            // Coluna de pedra entre portões
            // FIX Z-FIGHTING: Z movido para gateZ + 0.04 (levemente recuado em relação ao parapeito da janela acima que está em 0.76)
            if (xPos === -0.8) lot.add(createBox(0.2, 1.4, 0.2, stoneColor, -0.2, 0.7, gateZ + 0.04, isNight));
        }

        // 3. Segundo Andar (Janelas com detalhes)
        const winY = 1.3;
        for (let xPos of [-1.0, -0.2, 0.6]) {
            // Moldura de pedra
            lot.add(createBox(0.5, 0.6, 0.1, stoneColor, xPos, winY, 0.71, isNight));
            // Vidro
            lot.add(createWindow(0.4, 0.5, xPos, winY, 0.74, isNight, trimColor));
            // Parapeito
            lot.add(createBox(0.6, 0.1, 0.15, stoneColor, xPos, winY - 0.3, 0.76, isNight));
        }

        // 4. Cornija Decorativa (Topo)
        lot.add(createBox(3.0, 0.2, 2.4, stoneColor, -0.2, 1.8, -0.4, isNight));
        // FIX Z-FIGHTING: Reduzido altura levemente ou subido Y para não brigar com a pedra se sobrepuser
        lot.add(createBox(2.9, 0.1, 2.3, brickColor, -0.2, 1.951, -0.4, isNight));

        // 5. Torre de Mangueiras (Hose Tower) - Lateral Esquerda Traseira
        const towerX = 0.8; 
        const towerZ = -1.0;
        // Corpo da torre
        lot.add(createBox(1.0, 3.5, 1.0, brickColor, towerX, 1.75, towerZ, isNight));
        // Detalhes de quina na torre (Pedra) - Aumentei 0.01 na escala para garantir que cubra o tijolo
        lot.add(createBox(1.05, 0.2, 1.05, stoneColor, towerX, 1.2, towerZ, isNight));
        lot.add(createBox(1.05, 0.2, 1.05, stoneColor, towerX, 2.4, towerZ, isNight));
        
        // Janelas verticais da torre
        lot.add(createBox(0.4, 1.5, 0.1, 0x1a1a1a, towerX, 1.8, towerZ + 0.51, isNight)); // Fundo
        // FIX Z-FIGHTING: Z movido de +0.51 para +0.52 para a grade ficar à frente do fundo
        lot.add(createBox(0.05, 1.5, 0.12, trimColor, towerX, 1.8, towerZ + 0.52, isNight)); // Grade central
        
        // Topo da torre
        lot.add(createGableRoof(1.2, 1.2, 0.6, roofColor, towerX, 3.5, towerZ, isNight));
        
        // Sino/Sirene Antiga
        const bellGroup = new THREE.Group();
        bellGroup.position.set(towerX, 3.2, towerZ + 0.6);
        bellGroup.add(createBox(0.3, 0.3, 0.1, 0xffd700, 0, 0, 0, isNight));
        lot.add(bellGroup);

        // 6. Escada de Incêndio Lateral (Metal)
        const ladderX = -1.65;
        lot.add(createBox(0.1, 3.0, 0.1, 0x333333, ladderX, 1.5, -0.4, isNight)); // Haste principal
        for(let y=0.5; y<3.0; y+=0.3) {
            lot.add(createBox(0.3, 0.05, 0.1, 0x333333, ladderX + 0.1, y, -0.4, isNight)); // Degraus
        }

        // AC Unit no teto principal
        addACUnit(lot, 1.9, isNight);

    } else {
        // === VARIANTE 0: MODERNO / INDUSTRIAL (Concreto, Vermelho Vivo e Vidro) ===
        const concreteColor = 0xeeeeee;
        const accentColor = 0xd32f2f; // Vermelho bombeiro vivo
        const glassColor = 0x29b6f6;
        const metalColor = 0x455a64;

        // 1. Bloco Principal da Garagem (Largo e alto)
        lot.add(createBox(3.0, 1.6, 2.0, concreteColor, 0.2, 0.8, -0.2, isNight));
        
        // Faixa vermelha decorativa no topo
        // FIX Z-FIGHTING: Y movido para 1.51 e X/Z Scale aumentados minimamente (3.02, 2.02) para "encapar" o concreto
        lot.add(createBox(3.02, 0.2, 2.02, accentColor, 0.2, 1.51, -0.2, isNight));

        // 2. Grandes Portões de Vidro (Modernos)
        const doorW = 0.85;
        for (let i = 0; i < 3; i++) {
            const xPos = -0.8 + (i * 1.0);
            // Moldura
            lot.add(createBox(doorW, 1.2, 0.1, metalColor, xPos, 0.6, 0.8, isNight));
            // Vidro translúcido
            // Nota: Moldura Z=0.8, D=0.1 (Frente 0.85). Vidro Z=0.82, D=0.05 (Frente 0.845).
            // O vidro está contido na moldura, sem z-fighting frontal.
            const glass = createBox(doorW - 0.1, 1.1, 0.05, glassColor, xPos, 0.6, 0.82, isNight);
            if(isNight) (glass.material as THREE.MeshStandardMaterial).emissive.setHex(0x0277bd);
            lot.add(glass);
        }

        // 3. Bloco de Comando / Alojamento (Segundo andar destacado/Flutuante)
        const upperBlockX = -0.5;
        // Upper Block Face Frontal Z: -0.2 + (2.2/2) = 0.9
        lot.add(createBox(2.0, 1.2, 2.2, concreteColor, upperBlockX, 2.0, -0.2, isNight));
        
        // Janelão de canto (Corner Window)
        // FIX Z-FIGHTING: Aumentei Profundidade para 1.02.
        // Centro Z=0.4. D=1.02 -> Face Frontal = 0.4 + 0.51 = 0.91. 
        // Agora passa a face do bloco de concreto (0.9) por 0.01.
        const cornerGlass = createBox(0.1, 0.8, 1.02, glassColor, upperBlockX - 1.01, 2.0, 0.4, isNight); 
        lot.add(cornerGlass);

        const frontGlass = createBox(1.5, 0.8, 0.1, glassColor, upperBlockX - 0.2, 2.0, 0.91, isNight); // Frente
        if(isNight) (frontGlass.material as THREE.MeshStandardMaterial).emissive.setHex(0x0277bd);
        lot.add(frontGlass);
        
        // Detalhe vermelho vertical (Pilar)
        lot.add(createBox(0.3, 2.6, 0.3, accentColor, 1.5, 1.3, 0.8, isNight));

        // 4. Torre de Treinamento / Secagem (Estrutura vazada de metal)
        const rigX = 1.3;
        const rigZ = -1.0;
        // Pilares
        lot.add(createBox(0.1, 2.5, 0.1, metalColor, rigX - 0.3, 1.25, rigZ - 0.3, isNight));
        lot.add(createBox(0.1, 2.5, 0.1, metalColor, rigX + 0.3, 1.25, rigZ - 0.3, isNight));
        lot.add(createBox(0.1, 2.5, 0.1, metalColor, rigX - 0.3, 1.25, rigZ + 0.3, isNight));
        lot.add(createBox(0.1, 2.5, 0.1, metalColor, rigX + 0.3, 1.25, rigZ + 0.3, isNight));
        // Plataformas
        lot.add(createBox(0.8, 0.05, 0.8, metalColor, rigX, 1.0, rigZ, isNight));
        lot.add(createBox(0.8, 0.05, 0.8, metalColor, rigX, 2.0, rigZ, isNight));
        // Escada interna na torre
        lot.add(createBox(0.4, 2.5, 0.05, 0x333333, rigX, 1.25, rigZ, isNight));

        // 5. Detalhes do Telhado (Técnico)
        // Sirene rotativa moderna
        const sirenGroup = new THREE.Group();
        sirenGroup.position.set(-1.0, 2.6, 0.5);
        sirenGroup.add(createBox(0.4, 0.1, 0.4, 0xffffff, 0, 0, 0, isNight)); // Base (Topo em Y=0.05)
        
        // FIX Z-FIGHTING: Y subiu para 0.155.
        // Altura 0.2 -> Base da luz em 0.155 - 0.1 = 0.055.
        // Agora flutua 0.005 acima da base branca (0.05).
        const light = createBox(0.2, 0.2, 0.2, 0xff0000, 0, 0.155, 0, isNight); 
        if(isNight) {
             (light.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
             (light.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
        }
        sirenGroup.add(light);
        lot.add(sirenGroup);

        // Antenas de rádio
        lot.add(createBox(0.05, 1.5, 0.05, 0x90a4ae, 0, 3.0, 0, isNight));
        lot.add(createBox(0.02, 0.8, 0.02, 0x90a4ae, 0.2, 2.8, 0.2, isNight));

        // Unidades de ar condicionado industrial
        addACUnit(lot, 2.6, isNight); 
        
        // Tubulações externas na parede lateral
        // FIX Z-FIGHTING: Parede lateral está em X = -1.3 (Centro 0.2, Largura 3.0 -> Extensao [-1.3, 1.7])
        // Tubulação estava em -1.35. Metade da largura 0.05 -> Face interna -1.3. 
        // Movendo para -1.36 para desencostar da parede.
        lot.add(createBox(0.1, 1.5, 0.1, 0xef5350, -1.36, 0.8, -0.5, isNight));
        lot.add(createBox(0.8, 0.1, 0.1, 0xef5350, -1.0, 1.5, -0.5, isNight));
    }

    // Bandeira (Comum a ambos)
    const flag = createFlag(-1.6, 1.6, isNight);
    lot.add(flag);
};

export const renderGovSchool = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isV1 = variant === 1;

    // --- ELEMENTOS COMUNS ---
    // Mastro da bandeira (Sempre presente na frente)
    const flag = createFlag(1.2, 1.2, isNight);
    lot.add(flag);

    // Estacionamento de bicicletas (Bike Rack)
    const rackX = -1.2; const rackZ = 1.0;
    for(let i=0; i<3; i++) {
        lot.add(createBox(0.05, 0.3, 0.4, 0xbdbdbd, rackX + (i*0.2), 0.15, rackZ, isNight));
    }

    if (isV1) {
        // === VARIANTE 1: ESCOLA MODERNA E SUSTENTÁVEL ===
        // Estilo: Concreto branco, madeira ripada, vidro e energia solar.
        const wallColor = 0xf5f5f5;  // Branco Gelo
        const woodColor = 0x8d6e63;  // Madeira
        const glassColor = 0x81d4fa; // Vidro Azulado
        const darkTrim = 0x424242;   // Metal Escuro

        // 1. Bloco de Salas de Aula (Principal - Esquerda)
        lot.add(createBox(2.2, 1.5, 1.2, wallColor, -0.6, 0.75, -0.5, isNight));
        // Detalhe em madeira na fachada
        // Z=-0.5, D=1.3 -> Face frontal em 0.15. Parede em 0.1. (OK)
        lot.add(createBox(2.3, 0.6, 1.3, woodColor, -0.6, 1.2, -0.5, isNight));
        
        // Janelões de vidro (Curtain Wall)
        const windowW = 0.5;
        for(let i=0; i<3; i++) {
            const wx = -1.3 + (i * 0.7);
            const glass = createBox(windowW, 1.0, 0.05, glassColor, wx, 0.6, 0.11, isNight);
            if(isNight) (glass.material as THREE.MeshStandardMaterial).emissive.setHex(0x0277bd);
            lot.add(glass);
            
            // Brise-soleil (Quebra-sol) acima das janelas
            // FIX Z-FIGHTING: Movido Z de 0.15 para 0.20. 
            // Vidro face frontal: 0.11 + 0.025 = 0.135.
            // Brise face traseira: 0.20 - 0.1 = 0.10. (Ainda intercepta? Vamos mover mais pra frente).
            // Novo Z: 0.25. Face traseira = 0.15. Fica puramente na frente do vidro (0.135).
            lot.add(createBox(windowW + 0.1, 0.05, 0.2, darkTrim, wx, 1.15, 0.25, isNight));
        }

        // 2. Bloco do Auditório/Ginásio (Direita - Recuado)
        lot.add(createBox(1.4, 1.8, 1.6, 0xe0e0e0, 1.0, 0.9, -0.8, isNight));
        // Entrada Principal (Conexão entre blocos)
        lot.add(createBox(0.8, 1.0, 0.8, darkTrim, 0.4, 0.5, 0.0, isNight)); // Hall escuro
        lot.add(createDoor(0.5, 0.8, 0.4, 0.5, 0.41, isNight, 0x0288d1)); // Porta dupla azul

        // 3. Teto Ecológico
        // Painéis Solares no bloco mais alto
        for(let i=0; i<2; i++) {
            const panel = createBox(1.0, 0.05, 0.6, 0x1565c0, 1.0, 1.85, -1.0 + (i*0.7), isNight, true);
            panel.rotation.x = 0.1; // Inclinado
            lot.add(panel);
        }
        // Vegetação no teto do bloco baixo (Green Roof)
        // Y=1.51 garante que fique acima do teto Y=1.5
        lot.add(createBox(2.0, 0.05, 1.0, 0x66bb6a, -0.6, 1.51, -0.5, isNight));
        const rb1 = createBush(-1.0, -0.5, 0.5, isNight); rb1.position.y = 1.55; lot.add(rb1);
        const rb2 = createBush(-0.2, -0.8, 0.5, isNight); rb2.position.y = 1.55; lot.add(rb2);

        // 4. Quadra Poliesportiva (Frente Direita)
        const courtX = 1.0; const courtZ = 0.8;
        // Piso da quadra
        // Y=0.02, Altura 0.02 -> Topo em Y=0.03
        lot.add(createBox(1.6, 0.02, 1.2, 0x5c6bc0, courtX, 0.02, courtZ, isNight));
        
        // Linhas da quadra (Brancas)
        // FIX Z-FIGHTING: As linhas agora "flutuam" sobre o piso.
        // Piso Topo = 0.03. Linhas Y movido para 0.036 (base 0.021 ainda conflita se for muito grosso).
        // Melhor: Diminuir altura da linha para 0.01 e posicionar em 0.036. (Base 0.031 > Topo Piso 0.03).
        const lineHeight = 0.01;
        const lineY = 0.036; 
        
        lot.add(createBox(1.4, lineHeight, 0.05, 0xffffff, courtX, lineY, courtZ - 0.5, isNight)); // Fundo
        lot.add(createBox(1.4, lineHeight, 0.05, 0xffffff, courtX, lineY, courtZ + 0.5, isNight)); // Frente
        lot.add(createBox(0.05, lineHeight, 1.0, 0xffffff, courtX - 0.7, lineY, courtZ, isNight)); // Lateral
        lot.add(createBox(0.05, lineHeight, 1.0, 0xffffff, courtX + 0.7, lineY, courtZ, isNight)); // Lateral
        
        // Tabela de Basquete
        const hoopZ = courtZ + 0.6;
        lot.add(createBox(0.05, 1.2, 0.05, 0x424242, courtX, 0.6, hoopZ, isNight)); // Poste
        // FIX: Tabela um pouco mais a frente do poste
        lot.add(createBox(0.4, 0.3, 0.02, 0xffffff, courtX, 1.1, hoopZ - 0.06, isNight)); 
        lot.add(createBox(0.1, 0.02, 0.1, 0xff6d00, courtX, 1.0, hoopZ - 0.1, isNight)); // Aro

        // Ônibus Escolar Moderno (Amarelo Compacto) - APENAS SE RARO
        if (isRare) {
            const bus = createVehicle('bus', -1.0, 1.5, 0.3, isNight);
            lot.add(bus);
        }

    } else {
        // === VARIANTE 0: ESCOLA CLÁSSICA DE TIJOLOS ===
        // Estilo: Tradicional, simétrico, tijolo vermelho, torre do relógio.
        const brickColor = 0xbf360c; // Tijolo Vermelho Queimado
        const stoneColor = 0xe0e0e0; // Pedra (detalhes)
        const roofColor = 0x37474f;  // Telhado Ardósia
        
        // 1. Corpo Principal
        lot.add(createBox(3.4, 1.2, 1.4, brickColor, 0, 0.6, -0.6, isNight));
        // Base de pedra
        lot.add(createBox(3.5, 0.3, 1.5, stoneColor, 0, 0.15, -0.6, isNight));
        
        // 2. Telhado em duas águas
        lot.add(createGableRoof(3.5, 1.5, 0.6, roofColor, 0, 1.2, -0.6, isNight));

        // 3. Pórtico de Entrada (Central)
        // Escadaria
        lot.add(createBox(1.0, 0.1, 0.4, stoneColor, 0, 0.05, 0.2, isNight));
        lot.add(createBox(0.8, 0.1, 0.3, stoneColor, 0, 0.15, 0.1, isNight));
        // Colunas
        lot.add(createBox(0.15, 1.0, 0.15, stoneColor, -0.3, 0.6, 0.15, isNight));
        lot.add(createBox(0.15, 1.0, 0.15, stoneColor, 0.3, 0.6, 0.15, isNight));
        // Frontão triangular (Pediment)
        const pediment = createGableRoof(1.2, 0.5, 0.4, stoneColor, 0, 1.1, 0.15, isNight);
        pediment.scale.set(1, 0.8, 1);
        lot.add(pediment);
        // Portas duplas de madeira
        lot.add(createDoor(0.6, 0.7, 0, 0.45, 0.11, isNight, 0x5d4037));

        // 4. Torre do Relógio
        lot.add(createBox(0.6, 1.0, 0.6, brickColor, 0, 1.5, -0.6, isNight)); // Base
        lot.add(createBox(0.7, 0.1, 0.7, stoneColor, 0, 2.0, -0.6, isNight)); // Cornija
        
        // Relógio (Face branca + ponteiros pretos)
        // FIX Z-FIGHTING: Criar camadas explícitas
        const faceZ = -0.29;
        const hand1Z = -0.26; // +0.03 para frente
        const hand2Z = -0.25; // +0.04 para frente
        
        const clockFace = createBox(0.4, 0.4, 0.05, 0xffffff, 0, 1.7, faceZ, isNight);
        if(isNight) (clockFace.material as THREE.MeshStandardMaterial).emissive.setHex(0xaaaaaa);
        lot.add(clockFace);
        
        lot.add(createBox(0.02, 0.15, 0.06, 0x000000, 0, 1.75, hand1Z, isNight)); // Ponteiro 12h
        lot.add(createBox(0.1, 0.02, 0.06, 0x000000, 0.05, 1.7, hand2Z, isNight)); // Ponteiro 3h
        
        // Topo da torre (Piramidal)
        const spire = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 0.8, 4),
            new THREE.MeshStandardMaterial({ color: 0x263238 })
        );
        spire.position.set(0, 2.4, -0.6);
        spire.rotation.y = Math.PI/4;
        lot.add(spire);

        // 5. Janelas Clássicas (Simétricas)
        const winY = 0.8;
        for(let x of [-1.2, -0.8, 0.8, 1.2]) {
            lot.add(createWindow(0.3, 0.5, x, winY, 0.11, isNight, 0xffffff));
            // Detalhe de pedra acima da janela (Lintel)
            // FIX: Movido Z para 0.13 para garantir que fique à frente da janela (0.11)
            lot.add(createBox(0.35, 0.08, 0.05, stoneColor, x, winY + 0.3, 0.13, isNight));
        }

        // 6. Parquinho (Playground) - Lateral Esquerda
        const playX = -1.2; const playZ = 0.8;
        // Caixa de areia
        // Y=0.03, Alt=0.05 -> Top=0.055. OK.
        lot.add(createBox(1.2, 0.05, 1.2, 0xffe082, playX, 0.03, playZ, isNight));
        // Escorregador (Slide)
        const slideGroup = new THREE.Group();
        slideGroup.position.set(playX - 0.2, 0, playZ);
        // Escada
        slideGroup.add(createBox(0.1, 0.6, 0.1, 0x5d4037, 0, 0.3, -0.3, isNight));
        // Rampa
        const ramp = createBox(0.3, 0.05, 1.0, 0xff0000, 0, 0.3, 0.2, isNight);
        ramp.rotation.x = -0.5;
        slideGroup.add(ramp);
        lot.add(slideGroup);
        // Balanço Simples
        const swingX = playX + 0.4;
        lot.add(createBox(0.05, 0.8, 0.05, 0x3e2723, swingX, 0.4, playZ - 0.3, isNight)); // Poste 1
        lot.add(createBox(0.05, 0.8, 0.05, 0x3e2723, swingX + 0.6, 0.4, playZ - 0.3, isNight)); // Poste 2
        lot.add(createBox(0.7, 0.05, 0.05, 0x3e2723, swingX + 0.3, 0.8, playZ - 0.3, isNight)); // Barra topo
        lot.add(createBox(0.2, 0.02, 0.1, 0xffeb3b, swingX + 0.3, 0.3, playZ - 0.3, isNight)); // Assento

        // Ônibus Escolar Clássico (Longo) - APENAS SE RARO
        if (isRare) {
            const bus = createVehicle('bus', 1.2, 1.2, -0.2, isNight);
            lot.add(bus);
        }
    }

    // Cerca ao redor (exceto frente central)
    lot.add(createFence(3.8, 1.8, 0, 0.5, isNight)); 
};

export const renderGovClinic = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isV1 = variant === 1;

    // --- ELEMENTOS COMUNS ---
    // Bandeira (Sempre presente)
    const flag = createFlag(1.6, 1.6, isNight);
    lot.add(flag);

    if (isV1) {
        // === VARIANTE 1: CLÍNICA DA FAMÍLIA (UBS MODERNA) ===
        // Estilo: Acolhedor, comunitário, materiais naturais e vidro.
        const wallColor = 0xf5f5f5;  // Branco Off-white
        const woodColor = 0x8d6e63;  // Madeira clara
        const stoneAccent = 0x9e9e9e; // Pedra cinza
        const glassColor = 0x81d4fa; // Vidro Clean
        const frameColor = 0x424242; // Metal escuro para caixilharia

        // 1. Bloco Principal (Consultórios)
        lot.add(createBox(2.8, 1.0, 1.8, wallColor, -0.2, 0.5, -0.4, isNight));
        // Base de pedra (Rodapé alto)
        // FIX: Y movido para garantir sobreposição limpa com a parede branca
        lot.add(createBox(2.9, 0.3, 1.9, stoneAccent, -0.2, 0.15, -0.4, isNight));

        // 2. Recepção Envidraçada (Destaque na frente)
        const recepX = 0.5; const recepZ = 0.6;
        
        // Piso da recepção
        lot.add(createBox(1.5, 0.1, 1.0, 0xe0e0e0, recepX, 0.1, recepZ, isNight));
        
        // Estrutura/Moldura do Vidro (Realismo)
        lot.add(createBox(1.42, 0.8, 0.92, frameColor, recepX, 0.5, recepZ, isNight)); // Moldura grossa
        
        // Vidro (Recuado levemente da moldura para dar profundidade)
        const glass = createBox(1.4, 0.78, 0.94, glassColor, recepX, 0.5, recepZ, isNight); // Vidro um pouco mais largo no Z para sair da moldura na frente/trás
        if(isNight) (glass.material as THREE.MeshStandardMaterial).emissive.setHex(0x0277bd);
        lot.add(glass);

        // Teto da recepção (Laje em balanço)
        // FIX: Altura ajustada. Vidro vai até Y=0.9 (0.5 + 0.4). Teto começa em Y=0.9.
        // Para evitar z-fighting na junção, o teto sobe para 0.95 (base 0.9) e aumentamos 0.01 na escala.
        lot.add(createBox(1.8, 0.1, 1.4, woodColor, recepX, 0.95, recepZ, isNight));
        
        // 3. Brises de Madeira (Proteção solar na fachada lateral)
        const briseX = -1.0;
        for(let i=0; i<5; i++) {
            const zPos = -1.0 + (i * 0.3);
            // Variação aleatória de rotação para parecer mais orgânico/em uso
            const brise = createBox(0.05, 0.8, 0.2, woodColor, briseX, 0.6, zPos, isNight, true);
            brise.rotation.y = i % 2 === 0 ? 0.1 : -0.1;
            lot.add(brise);
        }

        // 4. Jardim Terapêutico (Entrada)
        const gardenX = -1.2; const gardenZ = 1.0;
        // Canteiros elevados
        lot.add(createBox(0.8, 0.3, 0.8, stoneAccent, gardenX, 0.15, gardenZ, isNight));
        // Terra (Offset Y para não brigar com a pedra)
        lot.add(createBox(0.6, 0.1, 0.6, 0x5d4037, gardenX, 0.31, gardenZ, isNight)); 
        // Plantas variadas
        const b1 = createBush(gardenX, gardenZ, 0.6, isNight); b1.position.y = 0.4; lot.add(b1);
        const b2 = createBush(gardenX + 0.2, gardenZ + 0.2, 0.4, isNight); b2.position.y = 0.4; lot.add(b2);
        const b3 = createBush(gardenX - 0.2, gardenZ - 0.2, 0.5, isNight); b3.position.y = 0.4; lot.add(b3);
        // Banco de madeira no jardim
        lot.add(createBox(0.6, 0.1, 0.2, woodColor, gardenX, 0.2, gardenZ + 0.6, isNight));

        // 5. Teto Técnico / Sustentável
        // Volume da caixa d'água (escondido em madeira)
        lot.add(createBox(0.8, 0.6, 0.8, woodColor, -0.8, 1.3, -0.5, isNight));
        // Painéis solares
        const panel = createBox(1.2, 0.05, 0.8, 0x1565c0, 0.5, 1.05, -0.5, isNight, true);
        panel.rotation.x = 0.1;
        lot.add(panel);

        // Cruz Verde (Símbolo discreto)
        const crossGroup = new THREE.Group();
        // Posição ajustada para ficar colada na laje de madeira do teto da recepção
        crossGroup.position.set(1.41, 0.95, 0.6); // Lateral da laje
        crossGroup.rotation.y = Math.PI / 2;
        
        // FIX Z-FIGHTING: Peças em camadas
        const vBar = createBox(0.1, 0.4, 0.05, 0x4caf50, 0, 0, 0, isNight);
        const hBar = createBox(0.4, 0.1, 0.05, 0x4caf50, 0, 0, 0.01, isNight); // Z+0.01 para frente
        
        if(isNight) {
            (vBar.material as THREE.MeshStandardMaterial).emissive.setHex(0x4caf50);
            (hBar.material as THREE.MeshStandardMaterial).emissive.setHex(0x4caf50);
        }
        crossGroup.add(vBar);
        crossGroup.add(hBar);
        lot.add(crossGroup);

        // Ambulância (Tipo Van de transporte) - APENAS SE RARO
        if (isRare) {
            const amb = createVehicle('ambulance', 1.2, 1.0, -0.3, isNight);
            lot.add(amb);
        }

    } else {
        // === VARIANTE 0: PRONTO SOCORRO (HOSPITAL DE EMERGÊNCIA) ===
        // Estilo: Institucional, azulejos brancos, detalhes vermelhos.
        const buildingColor = 0xffffff; // Branco Hospitalar
        const baseColor = 0x90a4ae;     // Cinza azulado
        const emergencyColor = 0xd32f2f;// Vermelho Urgência
        
        // 1. Bloco Principal (Internação/Triagem)
        lot.add(createBox(2.5, 2.0, 2.0, buildingColor, -0.5, 1.0, -0.5, isNight));
        // Faixa vermelha de "Emergência" ao redor
        // FIX: Escala aumentada minimamente (2.52) para garantir que encape o prédio
        lot.add(createBox(2.52, 0.15, 2.02, emergencyColor, -0.5, 1.5, -0.5, isNight));

        // 2. Marquise de Emergência (Ambulance Bay)
        const bayX = 1.0; const bayZ = 0.5;
        // Colunas de sustentação com sapatas (Realismo)
        const colSize = 0.15;
        for(let zOff of [0, 1.0]) {
             // Coluna
             lot.add(createBox(colSize, 1.2, colSize, baseColor, bayX, 0.6, bayZ - 0.2 + zOff, isNight));
             // Sapata (base da coluna para não furar o chão visualmente)
             lot.add(createBox(colSize + 0.1, 0.2, colSize + 0.1, 0x607d8b, bayX, 0.1, bayZ - 0.2 + zOff, isNight));
        }

        // Teto da marquise
        lot.add(createBox(1.8, 0.2, 2.0, 0xe0e0e0, bayX - 0.2, 1.3, bayZ + 0.3, isNight));
        
        // Sinal luminoso "EMERGÊNCIA" na marquise
        // FIX: Posição Z ajustada para flutuar na frente da marquise
        const signBox = createBox(1.4, 0.3, 0.1, emergencyColor, bayX - 0.2, 1.3, bayZ + 1.31, isNight);
        if(isNight) {
            (signBox.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
            (signBox.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        }
        lot.add(signBox);

        // 3. Área Técnica (Tanque de O2 e Gerador)
        const techX = -1.5; const techZ = 0.8;
        // Base do tanque
        lot.add(createBox(0.7, 0.1, 0.7, 0x78909c, techX, 0.05, techZ, isNight));
        
        // Tanque de Oxigênio Líquido (Cilindro branco grande)
        const tankGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16);
        const tankMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.2});
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(techX, 0.7, techZ); // Elevado para ter "pernas"
        tank.castShadow = true;
        lot.add(tank);
        
        // Pernas do tanque (Realismo)
        lot.add(createBox(0.05, 0.2, 0.05, 0x546e7a, techX - 0.15, 0.2, techZ - 0.15, isNight));
        lot.add(createBox(0.05, 0.2, 0.05, 0x546e7a, techX + 0.15, 0.2, techZ - 0.15, isNight));
        lot.add(createBox(0.05, 0.2, 0.05, 0x546e7a, techX, 0.2, techZ + 0.2, isNight));

        // Tubulações saindo do tanque para o prédio
        lot.add(createBox(0.8, 0.05, 0.05, 0x90caf9, techX + 0.4, 0.3, techZ, isNight));

        // 4. Heliponto Tático / Teto Complexo
        // Caixa de máquinas de elevador/escada
        lot.add(createBox(0.8, 0.6, 0.8, 0xe0e0e0, -0.5, 2.3, -0.5, isNight));
        
        // O "H" no teto (Pintura)
        const heliY = 2.02; // Altura da base do teto
        const heliBase = createBox(1.5, 0.05, 1.5, 0x37474f, -0.5, heliY, -0.5, isNight);
        lot.add(heliBase);
        
        // FIX Z-FIGHTING: Camadas de altura para o H
        const paintY = heliY + 0.03; // Pouco acima da base cinza
        const crossBarY = paintY + 0.005; // Pouco acima das pernas do H
        
        const hShape1 = createBox(0.8, 0.01, 0.2, 0xffeb3b, -0.5, crossBarY, -0.5, isNight); // Barra H (Cima)
        const hShape2 = createBox(0.2, 0.01, 0.8, 0xffeb3b, -0.8, paintY, -0.5, isNight); // Perna H
        const hShape3 = createBox(0.2, 0.01, 0.8, 0xffeb3b, -0.2, paintY, -0.5, isNight); // Perna H
        
        if(isNight) {
             const mat = new THREE.MeshStandardMaterial({color: 0xffeb3b, emissive: 0xffeb3b, emissiveIntensity: 0.2});
             (hShape1 as THREE.Mesh).material = mat;
             (hShape2 as THREE.Mesh).material = mat;
             (hShape3 as THREE.Mesh).material = mat;
        }
        lot.add(hShape1); lot.add(hShape2); lot.add(hShape3);

        // 5. Ambulância (Sempre presente na marquise) - APENAS SE RARO
        if (isRare) {
            const amb = createVehicle('ambulance', bayX - 0.2, 0.5, 0.8, isNight);
            amb.rotation.y = Math.PI; // De costas para a rua (estacionada de ré)
            lot.add(amb);
        }
        
        // Detalhes extras: Luzes de parede
        const wallLight = createBox(0.1, 0.1, 0.05, 0xffeb3b, -1.0, 1.2, 0.51, isNight);
        if(isNight) (wallLight.material as THREE.MeshStandardMaterial).emissive.setHex(0xffeb3b);
        lot.add(wallLight);
    }
};
