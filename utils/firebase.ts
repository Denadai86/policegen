import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, Firestore, setLogLevel, doc, collection, query, where, getDocs, QuerySnapshot, DocumentData, orderBy, limit } from 'firebase/firestore';

// Ativa o log de debug do Firestore (útil para desenvolvimento)
setLogLevel('debug');

// Variáveis Globais (fornecidas pelo ambiente Canvas/Vercel)
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

// Configuração do Firebase (tenta múltiplas fontes: variável global do ambiente,
// variável NEXT_PUBLIC_FIREBASE_CONFIG (JSON) ou variáveis NEXT_PUBLIC individuais)
let firebaseConfig: any = {};
try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        firebaseConfig = JSON.parse(__firebase_config);
    } else if (typeof window !== 'undefined' && (window as any).__firebase_config) {
        firebaseConfig = JSON.parse((window as any).__firebase_config);
    } else if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
        firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
    } else if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        // Fallback: montar a config a partir de variáveis públicas individuais
        firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
    }
} catch (e) {
    console.error('Erro ao parsear configuração do Firebase:', e);
    firebaseConfig = {};
}

// Inicializa o Firebase, mas apenas se houver uma configuração válida
let firebaseApp = null;
if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
    try {
        firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Erro ao inicializar o Firebase App:", e);
    }
} else {
    // Não temos configuração válida — informar no console (útil em dev local sem .env)
    console.warn('Firebase config não encontrada. Inicialização do Firebase foi ignorada. Verifique .env.local ou NEXT_PUBLIC_* variables.');
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
// HOOK SIMPLES DE AUTENTICAÇÃO (useAuth)
// Retorna { user, loading } e utiliza authenticateUser() como fonte.
// Útil para componentes React que precisam de um estado simples de usuário.
// -------------------------------------------------------------
import { useEffect, useState } from 'react';

export function useAuth() {
    const [user, setUser] = useState<{ uid: string } | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const uid = await authenticateUser();
                if (mounted) setUser(uid ? { uid } as any : null);
            } catch (e) {
                console.error('Erro em useAuth:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => { mounted = false; };
    }, []);

    return { user, loading };
}