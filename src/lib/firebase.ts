import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDTONG9yWXJEC4Sc4v8RNRLLlTbeTby5Ws",
  authDomain: "popup-exchange.firebaseapp.com",
  projectId: "popup-exchange",
  storageBucket: "popup-exchange.firebasestorage.app",
  messagingSenderId: "228923985377",
  appId: "1:228923985377:web:eb2976dcf2b2a0507cd6a0",
  measurementId: "G-D5JFMKZFFY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 아이디 중복 검사
export const checkUsernameAvailability = async (username: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
};

// 아이디로 사용자 정보 가져오기
export const getUserByUsername = async (username: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    return {
      ...querySnapshot.docs[0].data(),
      uid: querySnapshot.docs[0].id
    };
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
};

export const signUp = async (username: string, password: string, role: 'user' | 'admin' = 'user') => {
  try {
    // 아이디 중복 검사
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      return { user: null, error: '이미 사용 중인 아이디입니다.' };
    }

    // Firebase Authentication을 위한 이메일 생성
    const email = `${username}@popup-exchange.com`;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', user.uid), {
      username,
      role,
      createdAt: new Date().toISOString(),
    });

    return { user: { ...user, username, role }, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { 
      user: null, 
      error: error instanceof Error ? 
        error.message === 'Firebase: Error (auth/email-already-in-use).' ? 
          '이미 사용 중인 아이디입니다.' : 
          error.message 
        : '회원가입 중 오류가 발생했습니다.' 
    };
  }
};

export const signIn = async (username: string, password: string) => {
  try {
    // 사용자 정보 조회
    const userData = await getUserByUsername(username);
    if (!userData) {
      return { user: null, error: '존재하지 않는 아이디입니다.' };
    }

    // Firebase Authentication으로 로그인
    const email = `${username}@popup-exchange.com`;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    return { 
      user: { 
        ...user, 
        username: userData.username, 
        role: userData.role 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Signin error:', error);
    return { 
      user: null, 
      error: error instanceof Error ? 
        error.message === 'Firebase: Error (auth/invalid-credential).' ? 
          '아이디 또는 비밀번호가 올바르지 않습니다.' : 
          error.message 
        : '로그인 중 오류가 발생했습니다.' 
    };
  }
};

export default app; 