const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, get, remove} = require('firebase/database');

// Check if environment variables are properly set
if (!process.env.VITE_FIREBASE_API_KEY || 
    !process.env.VITE_FIREBASE_AUTH_DOMAIN || 
    !process.env.VITE_FIREBASE_DATABASE_URL || 
    !process.env.VITE_FIREBASE_PROJECT_ID || 
    !process.env.VITE_FIREBASE_STORAGE_BUCKET || 
    !process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 
    !process.env.VITE_FIREBASE_APP_ID) {
    console.error('\x1b[31m%s\x1b[0m', `
╔════════════════════════ ERROR ════════════════════════╗
║                                                       ║
║   Missing Firebase Environment Variables!             ║
║                                                       ║
║   Please create a .env file in the root directory    ║
║   with the following variables:                       ║
║                                                       ║
║   VITE_FIREBASE_API_KEY                              ║
║   VITE_FIREBASE_AUTH_DOMAIN                          ║
║   VITE_FIREBASE_DATABASE_URL                         ║
║   VITE_FIREBASE_PROJECT_ID                           ║
║   VITE_FIREBASE_STORAGE_BUCKET                       ║
║   VITE_FIREBASE_MESSAGING_SENDER_ID                  ║
║   VITE_FIREBASE_APP_ID                               ║
║                                                       ║
║   You can copy these from .env.example               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);
    process.exit(1);
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

class FirebaseManager {
    constructor() {
        const app = initializeApp(firebaseConfig);
        this.db = getDatabase(app);
    }

    async addJobBoard(name) {
        try {
            const jobBoardsRef = ref(this.db, 'job_boards');
            const snapshot = await get(jobBoardsRef);
            
            // Проверяем, существует ли уже такой job board
            let exists = false;
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    if (childSnapshot.val().name === name) {
                        exists = true;
                    }
                });
            }
            
            if (!exists) {
                await push(jobBoardsRef, { name });
            }
            return true;
        } catch (error) {
            console.error('Error adding job board:', error);
            return false;
        }
    }

    // Get current time in ISO format
    getCurrentTime() {
        return new Date().toISOString();
    }

    async addResponse(jobBoard) {
        try {
            const responsesRef = ref(this.db, 'responses');
            await push(responsesRef, {
                jobBoard,
                timestamp: new Date().toString()
            });
            return true;
        } catch (error) {
            console.error('Error adding response:', error);
            return false;
        }
    }

    async getAllResponses() {
        try {
            const responsesRef = ref(this.db, 'responses');
            const snapshot = await get(responsesRef);
            const responses = [];
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    responses.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
            }
            
            // Sort responses by timestamp in descending order (newest first)
            return responses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error getting responses:', error);
            return [];
        }
    }

    async getAllJobBoards() {
        try {
            const jobBoardsRef = ref(this.db, 'job_boards');
            const snapshot = await get(jobBoardsRef);
            const jobBoards = [];
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    jobBoards.push(childSnapshot.val().name);
                });
            }
            
            return jobBoards;
        } catch (error) {
            console.error('Error getting job boards:', error);
            return [];
        }
    }

    async removeResponse(id) {
        try {
            if (!id) {
                console.error('No response ID provided');
                return false;
            }
            const responseRef = ref(this.db, `responses/${id}`);
            await remove(responseRef);
            return true;
        } catch (error) {
            console.error('Error removing response:', error);
            return false;
        }
    }

    async clearAllData() {
        try {
            const responsesRef = ref(this.db, 'responses');
            await remove(responsesRef);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    async clearTodayData() {
        try {
            const responsesRef = ref(this.db, 'responses');
            const snapshot = await get(responsesRef);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (snapshot.exists()) {
                const promises = [];
                snapshot.forEach((childSnapshot) => {
                    const responseDate = new Date(childSnapshot.val().timestamp);
                    if (responseDate >= today) {
                        const responseRef = ref(this.db, `responses/${childSnapshot.key}`);
                        promises.push(remove(responseRef));
                    }
                });
                await Promise.all(promises);
            }
            return true;
        } catch (error) {
            console.error('Error clearing today data:', error);
            return false;
        }
    }

    async loadData() {
        try {
            const responses = await this.getAllResponses();
            const jobBoards = await this.getAllJobBoards();
            return {
                responses,
                jobBoards
            };
        } catch (error) {
            console.error('Error loading data:', error);
            return {
                responses: [],
                jobBoards: []
            };
        }
    }
}

module.exports = FirebaseManager;
