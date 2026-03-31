import {
    initializeApp
} from 'firebase/app';
import {
    getAuth
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyDR-pKA3qLP-ahhk15dY5QjsrGrTylY3uw',
    authDomain: 'eventflex-cc1c0.firebaseapp.com',
    projectId: 'eventflex-cc1c0',
    storageBucket: 'eventflex-cc1c0.firebasestorage.app',
    messagingSenderId: '822086386417',
    appId: '1:822086386417:web:d224c67588a00964ed1f50',
    measurementId: 'G-GGF68K2N15',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;