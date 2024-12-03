const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, get, remove} = require('firebase/database');

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
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

    async addResponse(jobBoard, timestamp) {
        try {
            const responsesRef = ref(this.db, 'responses');
            await push(responsesRef, {
                jobBoard,
                timestamp: timestamp || new Date().toISOString() 
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
}

module.exports = FirebaseManager;
