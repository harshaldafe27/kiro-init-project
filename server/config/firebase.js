const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db;

const initFirebase = () => {
    if (admin.apps.length > 0) {
        db = admin.firestore();
        return db;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || 'eventflex-cc1c0';

    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId
            });
            console.log('Firebase: initialized with service account from env var');

        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            const credPath = path.resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS);
            const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId
            });
            console.log('Firebase: initialized with', credPath);

        } else {
            console.error('ERROR: No Firebase credentials. Add GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json to server/.env');
            process.exit(1);
        }

        db = admin.firestore();
        console.log('Firestore ready (project: ' + projectId + ')');
        return db;
    } catch (err) {
        console.error('Firebase init error:', err.message);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) initFirebase();
    return db;
};

module.exports = {
    initFirebase,
    getDB
};