import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, onSnapshot, updateDoc, 
  arrayUnion, runTransaction
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User 
} from 'firebase/auth';
import { 
  Train, ArrowLeftRight, Activity, 
  Navigation, CheckCircle2, AlertCircle, ZoomIn, ZoomOut, Shovel, 
  RotateCw, Check, X, MoveRight, CornerUpRight, ArrowUp
} from 'lucide-react';

// --- CONFIGURATION ---

const GRID_SIZE = 21;
const CENTER = 10;
const WIN_SCORE = 5;

// --- ASSETS & DATA ---

const LANDMARK_DATA = [
  { id: 'l_fortune', name: 'Fortune Teller', cat: 'Spiritual', diff: 'Rare', emoji: '🔮' },
  { id: 'l_cemetery', name: 'Cemetery', cat: 'Spiritual', diff: 'Rare', emoji: '🪦' },
  { id: 'l_antique', name: 'Antique Store', cat: 'Spiritual', diff: 'Rare', emoji: '🏺' },
  { id: 'l_theme', name: 'Theme Park', cat: 'Thrilling', diff: 'Medium', emoji: '🎢' },
  { id: 'l_zoo', name: 'Zoo', cat: 'Thrilling', diff: 'Medium', emoji: '🦁' },
  { id: 'l_stadium', name: 'Stadium', cat: 'Thrilling', diff: 'Medium', emoji: '🏟️' },
  { id: 'l_arcade', name: 'Arcade', cat: 'Thrilling', diff: 'Medium', emoji: '🕹️' },
  { id: 'l_tattoo', name: 'Tattoo Parlor', cat: 'Thrilling', diff: 'Medium', emoji: '🐉' },
  { id: 'l_museum', name: 'Museum', cat: 'Cultural', diff: 'Medium', emoji: '🏛️' },
  { id: 'l_theatre', name: 'Theatre', cat: 'Cultural', diff: 'Medium', emoji: '🎭' },
  { id: 'l_cinema', name: 'Cinema', cat: 'Cultural', diff: 'Medium', emoji: '🍿' },
  { id: 'l_clock', name: 'Clock Tower', cat: 'Cultural', diff: 'Medium', emoji: '🕰️' },
  { id: 'l_library', name: 'Library', cat: 'Cultural', diff: 'Medium', emoji: '📚' },
  { id: 'l_restaurant', name: 'Restaurant', cat: 'Foodie', diff: 'Easy', emoji: '🍽️' },
  { id: 'l_deli', name: 'Deli', cat: 'Foodie', diff: 'Easy', emoji: '🥪' },
  { id: 'l_sweet', name: 'Sweet Shop', cat: 'Foodie', diff: 'Easy', emoji: '🍬' },
  { id: 'l_market', name: 'Farmers Market', cat: 'Foodie', diff: 'Easy', emoji: '🥦' },
  { id: 'l_cafe', name: 'Cafe', cat: 'Foodie', diff: 'Easy', emoji: '☕' },
  { id: 'l_bar', name: 'Rooftop Bar', cat: 'Foodie', diff: 'Easy', emoji: '🍸' },
  { id: 'l_pier', name: 'Pier', cat: 'Relaxing', diff: 'Hard', emoji: '🎡' },
  { id: 'l_salon', name: 'Salon', cat: 'Relaxing', diff: 'Hard', emoji: '💇' },
  { id: 'l_park', name: 'Park', cat: 'Relaxing', diff: 'Hard', emoji: '🌳' },
  { id: 'l_spa', name: 'Spa', cat: 'Relaxing', diff: 'Hard', emoji: '🧖' },
  { id: 'l_observatory', name: 'Observatory', cat: 'Nature', diff: 'Medium', emoji: '🔭' },
  { id: 'l_garden', name: 'Botanic Garden', cat: 'Nature', diff: 'Medium', emoji: '🌻' },
  { id: 'l_flower', name: 'Flower Shop', cat: 'Nature', diff: 'Medium', emoji: '💐' },
  { id: 'l_country', name: 'Country Club', cat: 'Nature', diff: 'Medium', emoji: '⛳' },
  { id: 'l_dog', name: 'Dog Park', cat: 'Nature', diff: 'Medium', emoji: '🐕' },
  { id: 'l_post', name: 'Post Office', cat: 'Services', diff: 'Easy', emoji: '📮' },
  { id: 'l_airport', name: 'Airport', cat: 'Services', diff: 'Easy', emoji: '✈️' },
  { id: 'l_bank', name: 'Bank', cat: 'Services', diff: 'Medium', emoji: '💰' },
  { id: 'l_mall', name: 'Mall', cat: 'Services', diff: 'Medium', emoji: '🛍️' },
  { id: 'l_gym', name: 'Gym', cat: 'Services', diff: 'Easy', emoji: '🏋️' },
  { id: 'l_fire', name: 'Fire Dept', cat: 'Services', diff: 'Easy', emoji: '🚒' },
];

const PASSENGERS = [
  { id: 'p_mystic', name: 'The Mystic', from: 'l_fortune', to: 'l_cemetery' },
  { id: 'p_tourist', name: 'The Tourist', from: 'l_airport', to: 'l_museum' },
  { id: 'p_date', name: 'Date Night', from: 'l_restaurant', to: 'l_theatre' },
  { id: 'p_family', name: 'Family Fun', from: 'l_zoo', to: 'l_theme' },
  { id: 'p_scholar', name: 'The Scholar', from: 'l_library', to: 'l_antique' },
  { id: 'p_widow', name: 'The Widow', fromCat: 'Relaxing', to: 'l_cemetery' },
  { id: 'p_yoga', name: 'Yoga Mom', fromCat: 'Relaxing', toCat: 'Nature' },
  { id: 'p_critic', name: 'Food Critic', from: 'l_airport', toCat: 'Foodie' },
  { id: 'p_shop', name: 'Shopaholic', fromCat: 'Services', to: 'l_mall' },
  { id: 'p_student', name: 'The Student', from: 'l_library', toCat: 'Foodie' },
  { id: 'p_fitness', name: 'Fitness Freak', from: 'l_gym', toCat: 'Nature' },
  { id: 'p_junkie', name: 'Adrenaline Junkie', fromCat: 'Thrilling', toCat: 'Foodie' },
  { id: 'p_culture', name: 'Culture Vulture', fromCat: 'Cultural', toCat: 'Spiritual' },
  { id: 'p_errands', name: 'Weekend Errands', fromCat: 'Services', toCat: 'Foodie' },
  { id: 'p_romantic', name: 'The Romantic', fromCat: 'Nature', to: 'l_bar' },
];

const PLAYER_COLORS = [
  { id: 'blue', name: 'Piccadilly', hex: '#1c3f94', text: 'text-blue-700', bg: 'bg-blue-600', border: 'border-blue-600', light: 'bg-blue-50' },
  { id: 'green', name: 'District', hex: '#007229', text: 'text-green-700', bg: 'bg-green-700', border: 'border-green-700', light: 'bg-green-50' },
  { id: 'red', name: 'Central', hex: '#e32017', text: 'text-red-600', bg: 'bg-red-600', border: 'border-red-600', light: 'bg-red-50' },
  { id: 'black', name: 'Northern', hex: '#000000', text: 'text-gray-900', bg: 'bg-gray-900', border: 'border-gray-900', light: 'bg-gray-100' },
];

// --- TYPES ---

type CardType = 'track_straight' | 'track_curve' | 'landmark';
type Card = { id: string; type: CardType; landmarkId?: string };
type Player = {
  id: string;
  name: string;
  colorIdx: number;
  hand: Card[];
  score: number;
  tunnelUsed: boolean;
  cityHallConnected: boolean; 
  completedPassengers: string[];
};
type Tile = {
  x: number;
  y: number;
  landmark?: string; 
  segments: { [playerId: string]: { type: 'straight' | 'curve' | 'tunnel', rot: number } };
  tunnelConnections?: { [playerId: string]: { x: number, y: number }[] };
};
type GameState = {
  status: 'lobby' | 'playing' | 'finished';
  activePlayerIdx: number;
  players: Player[];
  board: { [key: string]: Tile };
  market: {
    passengers: string[];
    deckTracks: number;
    deckLandmarks: string[];
    deckPassengers: string[];
  };
  winner?: string;
};

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const APP_ID = 'mind_the_gap_prod';


// --- HELPER FUNCTIONS ---

const getTileKey = (x: number, y: number) => `${x},${y}`;

const shuffle = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Returns [N, E, S, W] booleans for connection possibility
const getSegmentExits = (type: string, rot: number) => {
  if (type === 'tunnel') return { N:true, E:true, S:true, W:true }; 
  if (type === 'straight') {
     if (rot === 0 || rot === 180) return { N:true, S:true, E:false, W:false }; // Vertical
     return { N:false, S:false, E:true, W:true }; // Horizontal
  }
  // Curve
  if (rot === 0) return { S:true, E:true, N:false, W:false };
  if (rot === 90) return { S:true, W:true, N:false, E:false };
  if (rot === 180) return { N:true, W:true, S:false, E:false };
  if (rot === 270) return { N:true, E:true, S:false, W:false };
  return { N:false, S:false, E:false, W:false };
};

const getOppositeDir = (dir: 'N'|'E'|'S'|'W') => {
    if (dir === 'N') return 'S';
    if (dir === 'S') return 'N';
    if (dir === 'E') return 'W';
    return 'E';
};

const createDeck = () => {
  const landmarks = shuffle(LANDMARK_DATA.map(l => l.id));
  const passengers = shuffle(PASSENGERS.map(p => p.id));
  return { landmarks, passengers };
};

const initialBoard = (): { [key: string]: Tile } => {
  const board: { [key: string]: Tile } = {};
  board[getTileKey(CENTER, CENTER)] = {
    x: CENTER, y: CENTER, landmark: 'CITY_HALL', segments: {}
  };
  return board;
};

// --- REACT COMPONENTS ---

export default function MindTheGap() {
  const [user, setUser] = useState<User | null>(null);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Selection States
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);
  const [actionMode, setActionMode] = useState<'build' | 'place' | 'tunnel' | null>(null);
  
  // Curve Interaction State
  const [curveStep, setCurveStep] = useState<'select_anchor' | 'select_direction' | null>(null);
  const [curveAnchor, setCurveAnchor] = useState<{x:number, y:number} | null>(null);
  const [curveOptions, setCurveOptions] = useState<{targetX:number, targetY:number, buildX:number, buildY:number, rot:number}[]>([]);
  
  // Tunnel State
  const [tunnelStage, setTunnelStage] = useState<'select_start' | 'select_end' | null>(null);
  const [tunnelStart, setTunnelStart] = useState<{x:number, y:number} | null>(null);

  const [zoom, setZoom] = useState(1);
  const [notification, setNotification] = useState<string | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);

  // AUTH
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined' && (window as any).__initial_auth_token) {
        await signInWithCustomToken(auth, (window as any).__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // SYNC
  useEffect(() => {
    if (!user || !roomId) return;
    const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);
    return onSnapshot(roomRef, (snap) => {
      if (snap.exists()) setGameState(snap.data() as GameState);
      else setGameState(null);
    }, (err) => console.error("Sync error", err));
  }, [user, roomId]);

  // ACTIONS
  const createRoom = async () => {
    if (!user || !playerName) return;
    const newRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const decks = createDeck();
    const hand: Card[] = [];
    for(let i=0; i<3; i++) hand.push({ id: `t_${Math.random()}`, type: Math.random() > 0.5 ? 'track_straight' : 'track_curve' });
    for(let i=0; i<2; i++) {
      const lid = decks.landmarks.pop();
      if(lid) hand.push({ id: lid, type: 'landmark', landmarkId: lid });
    }

    const initialState: GameState = {
      status: 'lobby',
      activePlayerIdx: 0,
      players: [{
        id: user.uid,
        name: playerName,
        colorIdx: 0,
        hand,
        score: 0,
        tunnelUsed: false,
        cityHallConnected: false,
        completedPassengers: []
      }],
      board: initialBoard(),
      market: {
        passengers: decks.passengers.splice(0, 3),
        deckTracks: 100,
        deckLandmarks: decks.landmarks,
        deckPassengers: decks.passengers
      }
    };
    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${newRoomId}`), initialState);
    setRoomId(newRoomId);
  };

  const joinRoom = async () => {
    if (!user || !playerName || !roomId) return;
    const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(roomRef);
      if (!sfDoc.exists()) throw "Room does not exist!";
      const state = sfDoc.data() as GameState;
      if (state.status !== 'lobby') throw "Game already started";
      if (state.players.length >= 4) throw "Room full";
      if (state.players.some(p => p.id === user.uid)) return;

      const decks = { ...state.market };
      const hand: Card[] = [];
      for(let i=0; i<3; i++) hand.push({ id: `t_${Math.random()}`, type: Math.random() > 0.5 ? 'track_straight' : 'track_curve' });
      for(let i=0; i<2; i++) {
        const lid = decks.deckLandmarks.pop();
        if(lid) hand.push({ id: lid, type: 'landmark', landmarkId: lid });
      }

      transaction.update(roomRef, {
        players: arrayUnion({
          id: user.uid, name: playerName, colorIdx: state.players.length,
          hand, score: 0, tunnelUsed: false, cityHallConnected: false, completedPassengers: []
        }),
        market: decks
      });
    });
  };

  const startGame = async () => {
    const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);
    await updateDoc(roomRef, { status: 'playing' });
  };

  // --- LOGIC ---
  const getCurrentPlayer = () => gameState?.players[gameState.activePlayerIdx];
  const isMyTurn = () => getCurrentPlayer()?.id === user?.uid;
  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const drawCard = (type: 'track' | 'landmark', currentHand: Card[], market: GameState['market']) => {
    const newHand = [...currentHand];
    const newMarket = { ...market };
    if (type === 'track') {
      newHand.push({ id: `t_${Math.random()}`, type: Math.random() > 0.5 ? 'track_straight' : 'track_curve' });
    } else {
      const lid = newMarket.deckLandmarks.pop();
      if (lid) newHand.push({ id: lid, type: 'landmark', landmarkId: lid });
    }
    return { newHand, newMarket };
  };

  const toggleCardSelection = (idx: number) => {
    if (curveStep || tunnelStage) {
        resetTurnState();
    }

    const isSelected = selectedCardIndices.includes(idx);
    
    if (isSelected) {
      const newSelection = selectedCardIndices.filter(i => i !== idx);
      setSelectedCardIndices(newSelection);
      if (newSelection.length === 0) setActionMode(null);
      else if (newSelection.length === 1) {
        const card = getCurrentPlayer()?.hand[newSelection[0]];
        if (card?.type === 'landmark') setActionMode('place');
        else if (card?.type.startsWith('track')) setActionMode('build');
      }
    } else {
      if (selectedCardIndices.length === 0) {
        const card = getCurrentPlayer()?.hand[idx];
        setSelectedCardIndices([idx]);
        if (card?.type === 'landmark') setActionMode('place');
        else if (card?.type.startsWith('track')) {
             setActionMode('build');
             if (card.type === 'track_curve') {
                 setCurveStep('select_anchor'); 
             }
        }
      } else {
        setSelectedCardIndices(prev => [...prev, idx]);
        setActionMode(null);
        setCurveStep(null);
      }
    }
  };

  // --- BOARD INTERACTION ---
  const handleTileClick = async (x: number, y: number) => {
    if (!isMyTurn() || !gameState || gameState.status !== 'playing') return;
    const player = getCurrentPlayer()!;
    const key = getTileKey(x, y);
    const tile = gameState.board[key];

    // --- CURVE FLOW (Improved) ---
    if (actionMode === 'build' && curveStep) {
        const cardIdx = selectedCardIndices[0];
        const card = player.hand[cardIdx];
        if (card.type !== 'track_curve') return;

        // Step 1: Select Anchor (Track End)
        if (curveStep === 'select_anchor') {
            let validAnchor = false;
            let exits = { N:true, S:true, E:true, W:true };

            if (tile?.landmark === 'CITY_HALL') {
                if (player.cityHallConnected) { notify("City Hall exit already used!"); return; }
                validAnchor = true;
            } else if (tile?.segments && tile.segments[player.id]) {
                validAnchor = true;
                const seg = tile.segments[player.id];
                exits = getSegmentExits(seg.type, seg.rot);
            } else if (tile?.tunnelConnections?.[player.id]?.some(pt => pt.x === x && pt.y === y)) {
                validAnchor = true;
            }

            if (!validAnchor) { notify("Click the END of your track to extend from."); return; }

            const options: {targetX:number, targetY:number, buildX:number, buildY:number, rot:number}[] = [];
            
            // Check all 4 neighbors of Anchor
            const neighbors = [
                { dx: 0, dy: -1, label: 'N', entry: 'S' }, 
                { dx: 1, dy: 0, label: 'E', entry: 'W' },
                { dx: 0, dy: 1, label: 'S', entry: 'N' },
                { dx: -1, dy: 0, label: 'W', entry: 'E' }
            ];

            for (const n of neighbors) {
                // 1. Can we exit anchor in this direction?
                // @ts-ignore
                if (!exits[n.label] && tile?.landmark !== 'CITY_HALL') continue;

                const buildX = x + n.dx;
                const buildY = y + n.dy;
                const buildKey = getTileKey(buildX, buildY);
                const buildTile = gameState.board[buildKey];

                // 2. Is the build spot empty?
                if (buildTile?.landmark) continue;
                if (buildTile?.segments && buildTile.segments[player.id]) continue; 

                // 3. Calculate "Target" Ghost Tiles (Left/Right turns)
                // If entering BuildTile from 'entry', we can turn Left or Right.
                const validRots: number[] = [];
                if (n.entry === 'S') validRots.push(0, 90);      
                if (n.entry === 'N') validRots.push(180, 270);   
                if (n.entry === 'W') validRots.push(90, 180);    
                if (n.entry === 'E') validRots.push(0, 270);     

                validRots.forEach(rot => {
                    const curveExits = getSegmentExits('curve', rot);
                    // Which exit is NOT the entry?
                    let exitDir = '';
                    if (curveExits.N && n.entry !== 'N') exitDir = 'N';
                    if (curveExits.S && n.entry !== 'S') exitDir = 'S';
                    if (curveExits.E && n.entry !== 'E') exitDir = 'E';
                    if (curveExits.W && n.entry !== 'W') exitDir = 'W';

                    let targetX = buildX, targetY = buildY;
                    if (exitDir === 'N') targetY--;
                    if (exitDir === 'S') targetY++;
                    if (exitDir === 'E') targetX++;
                    if (exitDir === 'W') targetX--;
                    
                    // Check if Target tile is valid (doesn't have to be empty, just valid coordinate)
                    if (targetX >= 0 && targetX < GRID_SIZE && targetY >= 0 && targetY < GRID_SIZE) {
                        options.push({ targetX, targetY, buildX, buildY, rot });
                    }
                });
            }
            
            if (options.length === 0) { notify("No room for a curve here!"); return; }

            setCurveAnchor({x, y});
            setCurveOptions(options);
            setCurveStep('select_direction');
            return;
        }

        // Step 2: Select Direction Ghost
        if (curveStep === 'select_direction') {
            const opt = curveOptions.find(o => o.targetX === x && o.targetY === y);
            if (!opt) {
                if (x === curveAnchor?.x && y === curveAnchor?.y) {
                    setCurveStep('select_anchor');
                    setCurveOptions([]);
                    return;
                }
                notify("Click a highlighted destination tile to curve towards.");
                return;
            }

            // Build Logic
            const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);
            const { newHand, newMarket } = drawCard('track', player.hand.filter((_, i) => i !== cardIdx), gameState.market);
            
            let connectedToCityHall = player.cityHallConnected;
            if (Math.abs(opt.buildX - CENTER) + Math.abs(opt.buildY - CENTER) === 1) connectedToCityHall = true;

            const bKey = getTileKey(opt.buildX, opt.buildY);

            await runTransaction(db, async (t) => {
                const sfDoc = await t.get(roomRef);
                const currentState = sfDoc.data() as GameState;
                const b = { ...currentState.board };
                
                if (!b[bKey]) b[bKey] = { x: opt.buildX, y: opt.buildY, segments: {} };
                b[bKey].segments = { ...b[bKey].segments, [player.id]: { type: 'curve', rot: opt.rot } };

                t.update(roomRef, {
                    [`board.${bKey}`]: b[bKey],
                    players: currentState.players.map(p => p.id === player.id ? { ...p, hand: newHand, cityHallConnected: connectedToCityHall } : p),
                    market: newMarket,
                    activePlayerIdx: (currentState.activePlayerIdx + 1) % currentState.players.length
                });
            });
            resetTurnState();
        }
        return;
    }

    // --- TUNNEL (Any Distance Straight) ---
    if (actionMode === 'tunnel') {
        if (!tunnelStage || tunnelStage === 'select_start') {
            if (tile?.landmark === 'CITY_HALL' || tile?.segments?.[player.id]) {
                setTunnelStart({ x, y });
                setTunnelStage('select_end');
                notify("Select tunnel exit (Any straight line)");
            } else {
                notify("Start tunnel at your existing track!");
            }
        } else if (tunnelStage === 'select_end' && tunnelStart) {
            const dx = x - tunnelStart.x;
            const dy = y - tunnelStart.y;
            
            // Check Straight Line
            if (dx !== 0 && dy !== 0) { notify("Tunnel must be a straight line!"); return; }
            if (dx === 0 && dy === 0) return; // Clicked self

            // Check Obstructions? Prompt said "move anywhere". I interpret as "Underground" so ignores tracks.
            // Check Destination Occupancy
            if (tile?.segments && Object.keys(tile.segments).length > 0) { notify("Exit blocked!"); return; }
            if (tile?.landmark) { notify("Cannot tunnel into landmark directly!"); return; }

            const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);
            await runTransaction(db, async (t) => {
                 const cur = (await t.get(roomRef)).data() as GameState;
                 const b = { ...cur.board };
                 
                 const k = getTileKey(x, y);
                 if (!b[k]) b[k] = { x, y, segments: {} };
                 b[k].segments = { ...b[k].segments, [player.id]: { type: 'straight', rot: (dx!==0 ? 90 : 0) } };

                 const anchorKey = getTileKey(tunnelStart.x, tunnelStart.y);
                 if (!b[anchorKey]) b[anchorKey] = { x: tunnelStart.x, y: tunnelStart.y, segments: {} };
                 
                 const addConn = (k: string, tx: number, ty: number) => {
                     const conns = b[k].tunnelConnections || {};
                     const pConns = conns[player.id] || [];
                     pConns.push({ x: tx, y: ty });
                     b[k].tunnelConnections = { ...conns, [player.id]: pConns };
                 };

                 addConn(k, tunnelStart.x, tunnelStart.y);
                 addConn(anchorKey, x, y);

                 t.update(roomRef, {
                     board: b,
                     players: cur.players.map(p => p.id === player.id ? { ...p, tunnelUsed: true } : p),
                     activePlayerIdx: (cur.activePlayerIdx + 1) % cur.players.length
                 });
            });
            resetTurnState();
        }
        return;
    }

    // --- PLACE LANDMARK (Max 2 Conns Rule) ---
    if (actionMode === 'place' && selectedCardIndices.length === 1) {
      const cardIdx = selectedCardIndices[0];
      const card = player.hand[cardIdx];
      
      if (tile?.landmark) { notify("Tile occupied!"); return; }
      if (tile?.segments && Object.keys(tile.segments).length > 0) { notify("Track here!"); return; }
      
      let trackCount = 0;
      Object.values(gameState.board).forEach(t => { if(t.segments?.[player.id]) trackCount++; });
      if (trackCount < 3) { notify("You need 3 tracks before placing a landmark!"); return; }

      let nearNetwork = false;
      for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
           const t = gameState.board[getTileKey(x + dx, y + dy)];
           if (t && (t.landmark === 'CITY_HALL' || t.segments?.[player.id])) { nearNetwork = true; break; }
        }
        if (nearNetwork) break;
      }
      if (!nearNetwork) { notify("Must be within 3 tiles of your network!"); return; }

      for(let dx=-1; dx<=1; dx++) {
          for(let dy=-1; dy<=1; dy++) {
              if (dx===0 && dy===0) continue;
              const t = gameState.board[getTileKey(x+dx, y+dy)];
              if (t?.landmark) { notify("Too close to another landmark!"); return; }
          }
      }

      const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);
      const { newHand, newMarket } = drawCard('landmark', player.hand.filter((_, i) => i !== cardIdx), gameState.market);
      const newBoard = { ...gameState.board };
      newBoard[key] = { x, y, landmark: card.landmarkId, segments: {} };

      await updateDoc(roomRef, {
        [`board.${key}`]: newBoard[key],
        players: gameState.players.map(p => p.id === player.id ? { ...p, hand: newHand } : p),
        market: newMarket,
        activePlayerIdx: (gameState.activePlayerIdx + 1) % gameState.players.length
      });
      resetTurnState();
    }

    // --- BUILD STRAIGHT ---
    if (actionMode === 'build' && selectedCardIndices.length === 1 && !curveStep) {
        const cardIdx = selectedCardIndices[0];
        const card = player.hand[cardIdx];
        if (card.type !== 'track_straight') return; 

        if (tile?.landmark && tile.landmark !== 'CITY_HALL') { notify("Cannot build on landmark!"); return; }
        if (tile?.segments && Object.values(tile.segments).some(s => s)) { notify("Tile occupied!"); return; }

        const neighbors = [
          { dx: 0, dy: -1, dir: 'N' }, 
          { dx: 1, dy: 0, dir: 'E' },
          { dx: 0, dy: 1, dir: 'S' }, 
          { dx: -1, dy: 0, dir: 'W' }
        ];

        let validAnchor = false;
        let entryDir: 'N'|'E'|'S'|'W' = 'N';

        for (const n of neighbors) {
          const nk = getTileKey(x + n.dx, y + n.dy);
          const neighbor = gameState.board[nk];
          if (!neighbor) continue;

          const reqExit = getOppositeDir(n.dir as any); 
          
          let hasExit = false;
          if (neighbor.landmark === 'CITY_HALL') {
             if (player.cityHallConnected) continue; 
             hasExit = true; 
          } else if (neighbor.landmark) {
             // Landmark Logic: Hub
             // Allow connection if < 2 connections exist for me
             let connCount = 0;
             const neighborNeighbors = [{dx:0,dy:-1}, {dx:1,dy:0}, {dx:0,dy:1}, {dx:-1,dy:0}];
             neighborNeighbors.forEach(nn => {
                 const t = gameState.board[getTileKey(neighbor.x + nn.dx, neighbor.y + nn.dy)];
                 if (t?.segments?.[player.id]) connCount++;
             });
             if (connCount >= 2) continue; 
             hasExit = true; 
          } else if (neighbor.segments && neighbor.segments[player.id]) {
             const seg = neighbor.segments[player.id];
             const exits = getSegmentExits(seg.type, seg.rot);
             // @ts-ignore
             if (exits[reqExit]) hasExit = true;
          } else if (neighbor.tunnelConnections?.[player.id]?.some(pt => pt.x === x && pt.y === y)) {
             hasExit = true;
          }

          if (hasExit) {
             validAnchor = true;
             entryDir = n.dir as any;
             break;
          }
        }

        if (!validAnchor) { notify("Must connect to an open track edge!"); return; }

        let rot = 0;
        if (entryDir === 'N' || entryDir === 'S') rot = 0; 
        else rot = 90; 

        const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);
        const { newHand, newMarket } = drawCard('track', player.hand.filter((_, i) => i !== cardIdx), gameState.market);
        
        let connectedToCityHall = player.cityHallConnected;
        if (Math.abs(x - CENTER) + Math.abs(y - CENTER) === 1) connectedToCityHall = true;

        await runTransaction(db, async (t) => {
            const sfDoc = await t.get(roomRef);
            const currentState = sfDoc.data() as GameState;
            const b = { ...currentState.board };
            
            if (!b[key]) b[key] = { x, y, segments: {} };
            b[key].segments = { ...b[key].segments, [player.id]: { type: 'straight', rot } };

            t.update(roomRef, {
                [`board.${key}`]: b[key],
                players: currentState.players.map(p => p.id === player.id ? { ...p, hand: newHand, cityHallConnected: connectedToCityHall } : p),
                market: newMarket,
                activePlayerIdx: (currentState.activePlayerIdx + 1) % currentState.players.length
            });
        });
        resetTurnState();
    }
  };

  const handleSwap = async () => {
      if (!isMyTurn() || selectedCardIndices.length === 0) { notify("Select cards to swap first"); return; }
      const player = getCurrentPlayer()!;
      const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);

      let tracksToDraw = 0;
      let landmarksToDraw = 0;

      selectedCardIndices.forEach(idx => {
          if (player.hand[idx].type === 'landmark') landmarksToDraw++;
          else tracksToDraw++;
      });

      const remainingHand = player.hand.filter((_, i) => !selectedCardIndices.includes(i));
      const decks = { ...gameState!.market };
      
      const newHand = [...remainingHand];
      for(let i=0; i<tracksToDraw; i++) newHand.push({ id: `t_${Math.random()}`, type: Math.random()>0.5 ? 'track_straight':'track_curve' });
      for(let i=0; i<landmarksToDraw; i++) {
          const l = decks.deckLandmarks.pop();
          if(l) newHand.push({ id: l, type: 'landmark', landmarkId: l });
      }

      await updateDoc(roomRef, {
           players: gameState!.players.map(p => p.id === player.id ? { ...p, hand: newHand } : p),
           market: decks,
           activePlayerIdx: (gameState!.activePlayerIdx + 1) % gameState!.players.length
      });
      resetTurnState();
  };

  const resetTurnState = () => {
      setActionMode(null);
      setSelectedCardIndices([]);
      setCurveStep(null);
      setCurveOptions([]);
      setCurveAnchor(null);
      setTunnelStage(null);
      setTunnelStart(null);
  };

  // --- PATHFINDING & SCORING ---
  // Runs on every update to check if user completed a passenger
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    const player = gameState.players.find(p => p.id === user?.uid);
    if (!player) return;

    // Build Graph for Player
    // Nodes: "x,y" strings.
    // Edges: Adjacency. Landmarks act as bridges.
    
    const graph = new Map<string, string[]>();
    const addEdge = (a: string, b: string) => {
        if (!graph.has(a)) graph.set(a, []);
        if (!graph.has(b)) graph.set(b, []);
        graph.get(a)!.push(b);
        graph.get(b)!.push(a);
    };

    // 1. Process Tracks
    Object.values(gameState.board).forEach(t => {
        const key = getTileKey(t.x, t.y);
        if (t.segments && t.segments[player.id]) {
            // Check connections based on type/rot
            const seg = t.segments[player.id];
            const exits = getSegmentExits(seg.type, seg.rot);
            // Connect to neighbors if they reciprocate OR are landmarks/tunnels
            const dirs = [{dx:0,dy:-1,l:'N',o:'S'}, {dx:1,dy:0,l:'E',o:'W'}, {dx:0,dy:1,l:'S',o:'N'}, {dx:-1,dy:0,l:'W',o:'E'}];
            
            dirs.forEach(d => {
                // @ts-ignore
                if (exits[d.l]) {
                    const nk = getTileKey(t.x+d.dx, t.y+d.dy);
                    const nt = gameState.board[nk];
                    if (!nt) return;
                    
                    let connects = false;
                    if (nt.landmark) connects = true; // Landmarks accept all
                    if (nt.segments?.[player.id]) {
                        const nSeg = nt.segments[player.id];
                        const nExits = getSegmentExits(nSeg.type, nSeg.rot);
                        // @ts-ignore
                        if (nExits[d.o]) connects = true;
                    }
                    if (nt.tunnelConnections?.[player.id]?.some(pt => pt.x === t.x && pt.y === t.y)) connects = true;

                    if (connects) addEdge(key, nk);
                }
            });
        }
    });

    // 2. Process Tunnels
    Object.values(gameState.board).forEach(t => {
        if (t.tunnelConnections?.[player.id]) {
            t.tunnelConnections[player.id].forEach(pt => {
                addEdge(getTileKey(t.x, t.y), getTileKey(pt.x, pt.y));
            });
        }
    });

    // 3. Process Landmarks (Bridge logic is handled by implicit adjacency above)
    // If a track points to a landmark, it adds edge Track <-> Landmark.
    // So if Track A -> Landmark <- Track B, then A-L-B path exists.

    // 4. BFS for Passengers
    const activePassengers = gameState.market.passengers.map(pid => PASSENGERS.find(p => p.id === pid)).filter(p => p);
    
    activePassengers.forEach(passenger => {
        if (!passenger) return;
        // Find Start Nodes
        const startNodes: string[] = [];
        const endNodes: string[] = [];

        Object.values(gameState.board).forEach(t => {
            if (!t.landmark || t.landmark === 'CITY_HALL') return;
            const l = LANDMARK_DATA.find(ld => ld.id === t.landmark);
            if (!l) return;

            // Check if this landmark is connected to graph
            const k = getTileKey(t.x, t.y);
            if (!graph.has(k)) return; 

            if (passenger.from === l.id || (passenger.fromCat && l.cat === passenger.fromCat)) startNodes.push(k);
            if (passenger.to === l.id || (passenger.toCat && l.cat === passenger.toCat)) endNodes.push(k);
        });

        // Search
        let found = false;
        for (const start of startNodes) {
            const q = [start];
            const visited = new Set<string>([start]);
            while (q.length > 0) {
                const curr = q.shift()!;
                if (endNodes.includes(curr)) { found = true; break; }
                const neighbors = graph.get(curr) || [];
                for (const n of neighbors) {
                    if (!visited.has(n)) {
                        visited.add(n);
                        q.push(n);
                    }
                }
            }
            if (found) break;
        }

        if (found) {
            // Claim!
            // We need to execute claim on DB. Guard to ensure we don't spam.
            if (gameState.activePlayerIdx === player.colorIdx && !player.completedPassengers.includes(passenger.id)) {
                 // Trigger claim transaction
                 const claim = async () => {
                     const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomId}`);
                     await runTransaction(db, async (t) => {
                         const sf = (await t.get(roomRef)).data() as GameState;
                         if (!sf.market.passengers.includes(passenger.id)) return; // Already claimed
                         
                         const newPas = sf.market.passengers.filter(id => id !== passenger.id);
                         if (sf.market.deckPassengers.length > 0) newPas.push(sf.market.deckPassengers.pop()!);
                         
                         const pts = 2; // Simplified points
                         const newPlayers = sf.players.map(p => {
                             if (p.id === player.id) return { ...p, score: p.score + pts, completedPassengers: [...p.completedPassengers, passenger.id] };
                             return p;
                         });
                         
                         t.update(roomRef, {
                             'market.passengers': newPas,
                             'market.deckPassengers': sf.market.deckPassengers,
                             players: newPlayers
                         });
                     });
                     notify(`COMPLETED: ${passenger.name}!`);
                 };
                 claim();
            }
        }
    });

  }, [gameState, user]);

  // --- RENDER ---
  if (!user) return <div className="p-10 font-sans flex items-center justify-center h-screen bg-stone-100">Connecting...</div>;
  if (!gameState) return (
       <div className="flex flex-col items-center justify-center h-screen bg-stone-100 font-sans text-stone-900">
           <div className="bg-white p-8 rounded-xl shadow-xl border w-96 text-center">
               <h1 className="text-3xl font-bold mb-6">MIND THE GAP</h1>
               <div className="space-y-4">
                    <input className="w-full p-2 border rounded" placeholder="Your Name" value={playerName} onChange={e => setPlayerName(e.target.value)} />
                    <button onClick={createRoom} className="w-full py-3 bg-stone-900 text-white font-bold rounded hover:bg-stone-800 disabled:opacity-50" disabled={!playerName}>CREATE ROOM</button>
                    <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-gray-400 text-xs">OR JOIN</span><div className="flex-grow border-t border-gray-300"></div></div>
                    <div className="flex gap-2">
                        <input className="flex-1 p-2 border rounded uppercase" placeholder="CODE" value={roomId} onChange={e => setRoomId(e.target.value.toUpperCase())} />
                        <button onClick={joinRoom} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50" disabled={!playerName || !roomId}>JOIN</button>
                    </div>
               </div>
           </div>
       </div>
  );

  if (gameState.status === 'lobby') return (
     <div className="flex flex-col items-center justify-center h-screen bg-stone-100 font-sans text-stone-900">
         <div className="bg-white p-8 rounded-xl shadow-xl border w-96 text-center">
             <h1 className="text-3xl font-bold mb-6">MIND THE GAP</h1>
             <h2 className="text-xl mb-4 font-mono bg-stone-100 p-2 rounded">Room: {roomId}</h2>
             <div className="space-y-4 mb-8">
                 {gameState.players.map(p => (
                     <div key={p.id} className={`p-3 rounded font-bold text-white ${PLAYER_COLORS[p.colorIdx].bg}`}>{p.name}</div>
                 ))}
                 {Array.from({length: 4 - gameState.players.length}).map((_, i) => (
                     <div key={i} className="p-3 rounded border-2 border-dashed border-stone-300 text-stone-400">Empty Slot</div>
                 ))}
             </div>
             {gameState.players[0].id === user?.uid ? (
                  <button onClick={startGame} className="w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700">START GAME</button>
             ) : <div className="text-stone-500 animate-pulse">Waiting for host...</div>}
         </div>
     </div>
  );

  const me = gameState.players.find(p => p.id === user?.uid);
  const myColor = PLAYER_COLORS[me?.colorIdx || 0];

  return (
    <div className="flex flex-col h-screen bg-stone-100 text-stone-900 font-sans overflow-hidden">
        {/* HEADER */}
        <div className="bg-white border-b p-3 flex justify-between items-center shadow-sm shrink-0 z-20">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight"><Train/> MIND THE GAP</div>
            <div className="flex gap-4">
                {gameState.players.map(p => (
                    <div key={p.id} className={`flex flex-col items-center px-3 py-1 rounded ${p.id === getCurrentPlayer()?.id ? 'bg-yellow-100 ring-2 ring-yellow-400' : ''}`}>
                        <div className="text-xs font-bold uppercase">{p.name}</div>
                        <div className={`h-1 w-full mt-1 rounded-full ${PLAYER_COLORS[p.colorIdx].bg}`}/>
                        <div className="text-xs text-stone-500">{p.score} pts</div>
                    </div>
                ))}
            </div>
        </div>

        {/* NOTIFICATION */}
        {notification && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-6 py-3 rounded-full font-bold shadow-xl z-50 animate-in fade-in slide-in-from-top-4">
                {notification}
            </div>
        )}

        <div className="flex-1 flex overflow-hidden">
            {/* LEFT: BOARD */}
            <div className="flex-1 relative bg-stone-200 overflow-hidden flex flex-col">
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                     <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="p-2 bg-white rounded shadow hover:bg-stone-50"><ZoomIn size={18}/></button>
                     <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 bg-white rounded shadow hover:bg-stone-50"><ZoomOut size={18}/></button>
                     <button onClick={() => boardRef.current?.scrollIntoView({behavior:'smooth', block:'center'})} className="p-2 bg-white rounded shadow hover:bg-stone-50"><Navigation size={18}/></button>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-10 flex justify-center items-center cursor-crosshair">
                     <div 
                        ref={boardRef}
                        className="grid bg-white shadow-2xl"
                        style={{ 
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 40px)`, 
                            width: `${GRID_SIZE * 40}px`,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center'
                        }}
                     >
                        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                            const x = i % GRID_SIZE;
                            const y = Math.floor(i / GRID_SIZE);
                            const key = getTileKey(x, y);
                            const tile = gameState.board[key];
                            const landmark = tile?.landmark ? LANDMARK_DATA.find(l => l.id === tile.landmark) : null;
                            const isCurveTarget = curveStep === 'select_direction' && curveOptions.some(o => o.targetX === x && o.targetY === y);

                            return (
                                <div 
                                    key={key}
                                    onClick={() => handleTileClick(x, y)}
                                    className={`
                                        w-[40px] h-[40px] border-[0.5px] border-stone-100 relative flex items-center justify-center select-none
                                        ${tile?.landmark === 'CITY_HALL' ? 'bg-stone-200' : ''}
                                        ${isCurveTarget ? 'bg-green-100 ring-4 ring-green-400 z-50 cursor-pointer hover:bg-green-200' : ''}
                                    `}
                                >
                                    {/* CITY HALL */}
                                    {tile?.landmark === 'CITY_HALL' && <div className="text-2xl">🏛️</div>}

                                    {/* LANDMARK */}
                                    {landmark && <div className="text-2xl z-10">{landmark.emoji}</div>}

                                    {/* TRACKS (Flush to Edge) */}
                                    {tile?.segments && Object.entries(tile.segments).map(([pid, seg]) => (
                                        <div key={pid} className="absolute inset-0 pointer-events-none">
                                            <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: `rotate(${seg.rot}deg)` }}>
                                                {seg.type === 'straight' && <line x1="20" y1="0" x2="20" y2="40" stroke={PLAYER_COLORS[gameState.players.find(p => p.id === pid)?.colorIdx||0].hex} strokeWidth="8" strokeLinecap="butt" />}
                                                {seg.type === 'curve' && <path d="M 20 40 Q 20 20 40 20" stroke={PLAYER_COLORS[gameState.players.find(p => p.id === pid)?.colorIdx||0].hex} fill="none" strokeWidth="8" strokeLinecap="butt" />}
                                            </svg>
                                        </div>
                                    ))}

                                    {/* CURVE GHOST PREVIEW */}
                                    {isCurveTarget && (
                                         <div className="absolute inset-0 flex items-center justify-center opacity-50">
                                             <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"/>
                                         </div>
                                    )}

                                    {/* TUNNEL MARKERS */}
                                    {tile?.tunnelConnections && Object.keys(tile.tunnelConnections).map(pid => (
                                         <div key={`ghost_${pid}`} className={`absolute w-2 h-2 rounded-full ${PLAYER_COLORS[gameState.players.find(p => p.id === pid)?.colorIdx||0].bg} opacity-50`} />
                                    ))}
                                </div>
                            );
                        })}
                     </div>
                </div>
            </div>

            {/* RIGHT: DASHBOARD (Martini Style) */}
            <div className="w-[400px] bg-white border-l shadow-2xl flex flex-col z-30">
                {/* TURN INDICATOR */}
                <div className="p-4 border-b flex justify-between items-center bg-stone-50">
                    <div className="font-bold text-stone-500 uppercase tracking-widest text-xs">Turn {Math.floor(gameState.board ? Object.keys(gameState.board).length / 4 : 1)}</div>
                    {isMyTurn() ? <div className="text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full text-xs animate-pulse">YOUR TURN</div> : <div className="text-stone-400 font-bold">WAITING...</div>}
                </div>

                {/* HAND */}
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-stone-800 uppercase tracking-widest text-sm">Your Hand</h3>
                        <div className="flex gap-2">
                             <button 
                                disabled={!isMyTurn() || me?.tunnelUsed}
                                onClick={() => { setActionMode('tunnel'); setTunnelStage('select_start'); setSelectedCardIndices([]); setCurveStep(null); }}
                                className={`px-3 py-1 rounded text-xs font-bold border ${actionMode === 'tunnel' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
                             >
                                 Tunnel {me?.tunnelUsed && '(X)'}
                             </button>
                             <button 
                                disabled={!isMyTurn()}
                                onClick={handleSwap}
                                className={`px-3 py-1 rounded text-xs font-bold border ${selectedCardIndices.length > 0 && !actionMode ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
                             >
                                 Swap
                             </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {me?.hand.map((card, idx) => {
                            const isSelected = selectedCardIndices.includes(idx);
                            const lData = card.landmarkId ? LANDMARK_DATA.find(l => l.id === card.landmarkId) : null;
                            
                            return (
                                <div 
                                    key={card.id}
                                    onClick={() => isMyTurn() && toggleCardSelection(idx)}
                                    className={`
                                        h-20 rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center p-2 text-center relative
                                        ${isSelected ? 'border-blue-500 ring-2 ring-blue-100 shadow-lg scale-[1.02]' : 'border-stone-200 hover:border-stone-300 hover:shadow'}
                                        ${!isMyTurn() ? 'opacity-50 grayscale' : ''}
                                    `}
                                >
                                    {card.type === 'landmark' ? (
                                        <>
                                            <div className="text-2xl mb-1">{lData?.emoji}</div>
                                            <div className="font-bold text-stone-800 text-[10px] leading-tight">{lData?.name}</div>
                                            {lData?.cat && <div className={`text-[8px] mt-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 uppercase font-bold tracking-wider`}>{lData.cat}</div>}
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-stone-300 mb-1">
                                                {card.type === 'track_straight' ? <MoveRight size={24} /> : <CornerUpRight size={24} />}
                                            </div>
                                            <div className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                                                {card.type === 'track_straight' ? 'Straight' : 'Curve'}
                                            </div>
                                        </>
                                    )}
                                    {isSelected && <div className="absolute top-1 right-1 text-blue-500"><CheckCircle2 size={12} fill="white" /></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* INSTRUCTIONS */}
                {curveStep === 'select_anchor' && (
                     <div className="p-4 border-t bg-stone-800 text-white text-xs font-bold flex justify-between">
                         <span>1. Select the END of your track (Anchor)</span>
                         <button onClick={resetTurnState}>Cancel</button>
                     </div>
                )}
                {curveStep === 'select_direction' && (
                     <div className="p-4 border-t bg-green-600 text-white text-xs font-bold flex justify-between">
                         <span>2. Select DESTINATION tile (Highlighted)</span>
                         <button onClick={resetTurnState}>Cancel</button>
                     </div>
                )}

                {/* PASSENGERS */}
                <div className="p-6 border-t bg-stone-50 h-1/3 overflow-y-auto">
                     <h3 className="font-bold text-stone-400 uppercase tracking-widest text-xs mb-4">Passengers</h3>
                     <div className="space-y-3">
                         {gameState.market.passengers.map(pid => {
                             const p = PASSENGERS.find(pa => pa.id === pid);
                             if(!p) return null;
                             return (
                                 <div key={pid} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                                     <div className="font-bold text-stone-800 text-sm mb-1">{p.name}</div>
                                     <div className="flex items-center gap-2 text-xs text-stone-500">
                                         {p.from ? <span className="bg-stone-100 px-1 rounded">{LANDMARK_DATA.find(l=>l.id===p.from)?.emoji}</span> : <span className="uppercase">{p.fromCat}</span>}
                                         <ArrowLeftRight size={10}/>
                                         {p.to ? <span className="bg-stone-100 px-1 rounded">{LANDMARK_DATA.find(l=>l.id===p.to)?.emoji}</span> : <span className="uppercase">{p.toCat}</span>}
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
}

