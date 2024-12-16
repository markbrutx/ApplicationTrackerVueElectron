const { getDatabase, ref, set, get } = require('firebase/database');

class CharacterManager {
    constructor(db) {
        this.db = db;
        this.characterRef = ref(this.db, 'character');
    }

    async initializeCharacter() {
        const snapshot = await get(this.characterRef);
        if (!snapshot.exists()) {
            await this.saveCharacter({
                level: 1,
                hp: 100,
                xp: 0,
                lastActivity: new Date().toISOString(),
                lastDeathCheck: new Date().toISOString()
            });
        }
    }

    async getCharacter() {
        const snapshot = await get(this.characterRef);
        return snapshot.exists() ? snapshot.val() : null;
    }

    async saveCharacter(characterData) {
        await set(this.characterRef, characterData);
    }

    async checkAndUpdateStatus() {
        const character = await this.getCharacter();
        if (!character) {
            await this.initializeCharacter();
            return { died: false };
        }

        if (!character.lastDeathCheck) {
            character.lastDeathCheck = new Date(0).toISOString();
            await this.saveCharacter(character);
        }

        const responsesRef = ref(this.db, 'responses');
        const responsesSnapshot = await get(responsesRef);
        const responses = responsesSnapshot.exists() ? Object.values(responsesSnapshot.val()) : [];
        
        responses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const lastResponse = responses.length > 0 
            ? new Date(responses[0].timestamp)
            : new Date(0);
        
        const now = new Date();
        const hoursSinceLastActivity = (now - lastResponse) / (1000 * 60 * 60);
        const lastDeathCheck = new Date(character.lastDeathCheck);
        const hoursSinceLastDeathCheck = (now - lastDeathCheck) / (1000 * 60 * 60);

        if (hoursSinceLastDeathCheck >= 24 || isNaN(hoursSinceLastDeathCheck)) {
            if (hoursSinceLastActivity >= 24) {
                const newLevel = Math.max(1, character.level - 1);
                return { 
                    died: true, 
                    currentLevel: character.level,
                    newLevel: newLevel,
                    newHp: 100,
                    lastDeathCheck: now.toISOString()
                };
            }
            character.lastDeathCheck = now.toISOString();
            await this.saveCharacter(character);
        }

        return { died: false };
    }

    calculateNextLevelXP(level) {
        return level * 100;
    }

    async addExperience(streak) {
        const character = await this.getCharacter();
        if (!character) return;

        const xpGain = 25 + (5 * streak);
        character.xp += xpGain;

        const nextLevelXP = this.calculateNextLevelXP(character.level);
        if (character.xp >= nextLevelXP) {
            character.level += 1;
            character.xp = character.xp - nextLevelXP;
        }

        character.lastActivity = new Date().toISOString();
        character.hp = 100; 

        await this.saveCharacter(character);

        return {
            currentLevel: character.level,
            currentXP: character.xp,
            levelUp: character.xp >= nextLevelXP
        };
    }
}

module.exports = CharacterManager;
