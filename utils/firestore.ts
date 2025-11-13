import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, Firestore, setLogLevel, doc, collection, query, where, getDocs, QuerySnapshot, DocumentData, orderBy, limit, addDoc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Ativa o log de debug do Firestore (útil para desenvolvimento)
setLogLevel('debug');

// Variáveis Globais (fornecidas pelo ambiente Canvas/Vercel)
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// Configuração do Firebase (parseada da variável global)
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {};

// Inicializa o Firebase, mas apenas se houver uma configuração válida
let firebaseApp = null;
if (Object.keys(firebaseConfig).length > 0) {
    try {
        firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Erro ao inicializar o Firebase App:", e);
    }
}

// -------------------------------------------------------------
// VARIÁVEIS EXPOSTAS
// -------------------------------------------------------------
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// -------------------------------------------------------------
// FUNÇÃO DE AUTENTICAÇÃO
// -------------------------------------------------------------

/**
 * Realiza o login do usuário no Firebase usando o token customizado
 * fornecido pelo ambiente, ou faz login anonimamente como fallback.
 * @returns O UID do usuário atual, ou null se a autenticação falhar.
 */
export async function authenticateUser(): Promise<string | null> {
    if (!auth) {
        console.error("Autenticação não pode ser iniciada: Firebase Auth não está disponível.");
        return null;
    }

    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            // Tenta fazer login com o token customizado (ambiente Canvas)
            const userCredential = await signInWithCustomToken(auth, __initial_auth_token);
            console.log("Login com token customizado realizado com sucesso.");
            return userCredential.user.uid;
        } else {
            // Tenta fazer login anonimamente (fallback para ambientes sem token customizado)
            const userCredential = await signInAnonymously(auth);
            console.log("Login anônimo realizado com sucesso.");
            return userCredential.user.uid;
        }
    } catch (error) {
        console.error("Erro na autenticação do Firebase:", error);
        return null;
    }
}

// -------------------------------------------------------------
// FUNÇÕES DE CAMINHO (PATHS) DO FIRESTORE
// -------------------------------------------------------------

/**
 * Cria o caminho para a coleção de dados PRIVADOS do usuário.
 * Estrutura: /artifacts/{appId}/users/{userId}/policies
 * @param userId O UID do usuário autenticado ou um ID temporário.
 * @returns O caminho completo da coleção.
 */
export const getPrivatePolicyCollectionPath = (userId: string) => 
    `artifacts/${APP_ID}/users/${userId}/policies`;

/**
 * Cria o caminho para a coleção de dados PÚBLICOS.
 * Estrutura: /artifacts/{appId}/public/data/shared_policies
 * @returns O caminho completo da coleção.
 */
export const getPublicPolicyCollectionPath = () => 
    `artifacts/${APP_ID}/public/data/shared_policies`;

/**
 * Cria o caminho para um documento específico na coleção PRIVADA.
 */
export const getPrivatePolicyDocRef = (userId: string, docId: string) => {
    if (!db) throw new Error("Firestore não inicializado.");
    return doc(db, getPrivatePolicyCollectionPath(userId), docId);
}

/**
 * Cria o caminho para um documento específico na coleção PÚBLICA.
 */
export const getPublicPolicyDocRef = (docId: string) => {
    if (!db) throw new Error("Firestore não inicializado.");
    return doc(db, getPublicPolicyCollectionPath(), docId);
}

/**
 * Obtém a referência da coleção privada de políticas
 */
export const getPrivatePolicyCollectionRef = (userId: string) => {
    if (!db) throw new Error("Firestore não inicializado.");
    return collection(db, getPrivatePolicyCollectionPath(userId));
}

/**
 * Obtém a referência da coleção pública de políticas
 */
export const getPublicPolicyCollectionRef = () => {
    if (!db) throw new Error("Firestore não inicializado.");
    return collection(db, getPublicPolicyCollectionPath());
}

// Re-exporta tipos importantes (opcional)
export type PolicyDocument = DocumentData;
export type PoliciesSnapshot = QuerySnapshot<DocumentData>;

// -------------------------------------------------------------
// HELPERS DE ALTA NÍVEL (saveDraft, loadDraft, savePolicy, getPoliciesHistory, deleteDocument)
// -------------------------------------------------------------

/** Salva um rascunho na coleção privada do usuário. */
export async function saveDraft(userId: string, data: any) {
    if (!db) throw new Error('Firestore não inicializado.');
    const colRef = getPrivatePolicyCollectionRef(userId);
    const docRef = await addDoc(colRef, {
        type: 'draft',
        data,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/** Carrega o rascunho mais recente do usuário (se houver). */
export async function loadDraft(userId: string): Promise<{ id: string; data?: any; type?: string; createdAt?: any } | null> {
    if (!db) return null;
    const colRef = getPrivatePolicyCollectionRef(userId);
    const q = query(colRef, where('type', '==', 'draft'), orderBy('createdAt', 'desc'), limit(1 as number));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const docData = doc.data();
    // Normalize the returned shape so callers can rely on `data` property
    return {
        id: doc.id,
        data: docData.data,
        type: docData.type,
        createdAt: docData.createdAt,
    };
}

/** Salva uma política final na coleção privada do usuário. */
export async function savePolicy(userId: string, payload: any) {
    if (!db) throw new Error('Firestore não inicializado.');
    const colRef = getPrivatePolicyCollectionRef(userId);
    const docRef = await addDoc(colRef, {
        type: 'policy',
        data: payload,
        policyContent: payload.policyContent || '',
        generatedAt: payload.generatedAt || new Date().toISOString(),
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/** Retorna o histórico de documentos (rascunhos + políticas) do usuário. */
export async function getPoliciesHistory(userId: string) {
    if (!db) return [];
    const colRef = getPrivatePolicyCollectionRef(userId);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Deleta um documento do usuário (rascunho ou política). */
export async function deleteDocument(userId: string, docId: string) {
    if (!db) throw new Error('Firestore não inicializado.');
    const docRef = getPrivatePolicyDocRef(userId, docId);
    await deleteDoc(docRef);
}