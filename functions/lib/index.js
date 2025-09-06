"use strict";
// functions/src/index.ts
// Firebase Functions for Prompt Party push notifications
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestNotification = exports.storeFCMToken = exports.notifyReaction = exports.notifyPlayerTurn = void 0;
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
// Initialize Firebase Admin SDK
admin.initializeApp();
// Initialize Firestore and Realtime Database
const db = admin.database();
const messaging = admin.messaging();
/**
 * Send push notification when it's a player's turn
 * Triggered when a new turn is added to the game
 */
exports.notifyPlayerTurn = functions.database.onValueUpdated('/games/{gameId}/turns', async (event) => {
    try {
        const gameId = event.params.gameId;
        const turnsArray = event.data.after.val();
        const previousTurnsArray = event.data.before.val();
        // Check if a new turn was actually added
        if (!turnsArray || !Array.isArray(turnsArray)) {
            console.log(`[FCM] No valid turns array in game ${gameId}`);
            return;
        }
        const currentTurnCount = turnsArray.length;
        const previousTurnCount = previousTurnsArray ? previousTurnsArray.length : 0;
        if (currentTurnCount <= previousTurnCount) {
            console.log(`[FCM] No new turn detected in game ${gameId}`);
            return;
        }
        const newTurn = turnsArray[currentTurnCount - 1];
        console.log(`[FCM] New turn detected in game ${gameId}:`, newTurn);
        // Get game data to determine next player
        const gameSnapshot = await db.ref(`/games/${gameId}`).once('value');
        const game = gameSnapshot.val();
        if (!game) {
            console.log(`[FCM] Game ${gameId} not found`);
            return;
        }
        // Calculate next player
        const currentPlayerIndex = game.currentPlayerIndex || 0;
        const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
        const nextPlayerId = game.players[nextPlayerIndex];
        // Get next player's FCM token
        const playerSnapshot = await db.ref(`/players/${nextPlayerId}/fcmToken`).once('value');
        const fcmToken = playerSnapshot.val();
        if (!fcmToken) {
            console.log(`[FCM] No FCM token for player ${nextPlayerId}`);
            return;
        }
        // Create notification payload
        const message = {
            token: fcmToken,
            notification: {
                title: 'Your turn in Prompt Party!',
                body: `It's your turn to add to the prompt. Current: "${game.currentPrompt || 'New game started!'}"`,
            },
            data: {
                gameId: gameId,
                type: 'turn',
                url: `/game/${gameId}`
            },
            webpush: {
                fcmOptions: {
                    link: `/game/${gameId}`
                }
            }
        };
        // Send the notification
        const response = await messaging.send(message);
        console.log(`[FCM] Turn notification sent successfully:`, response);
    }
    catch (error) {
        console.error('[FCM] Error sending turn notification:', error);
    }
});
/**
 * Send push notification when someone reacts to a player's image
 * Triggered when a new reaction is added
 */
exports.notifyReaction = functions.database.onValueCreated('/games/{gameId}/reactions/{reactionId}', async (event) => {
    try {
        const gameId = event.params.gameId;
        const reactionData = event.data.val();
        console.log(`[FCM] New reaction in game ${gameId}:`, reactionData);
        // Get the player who created the image that was reacted to
        const turnSnapshot = await db.ref(`/games/${gameId}/turns/${reactionData.turnId}`).once('value');
        const turn = turnSnapshot.val();
        if (!turn) {
            console.log(`[FCM] Turn ${reactionData.turnId} not found`);
            return;
        }
        const imageCreatorId = turn.playerId;
        // Don't notify if player reacted to their own image
        if (imageCreatorId === reactionData.playerId) {
            console.log(`[FCM] Player reacted to their own image, skipping notification`);
            return;
        }
        // Get image creator's FCM token
        const playerSnapshot = await db.ref(`/players/${imageCreatorId}/fcmToken`).once('value');
        const fcmToken = playerSnapshot.val();
        if (!fcmToken) {
            console.log(`[FCM] No FCM token for player ${imageCreatorId}`);
            return;
        }
        // Get reactor's name for notification
        const reactorSnapshot = await db.ref(`/players/${reactionData.playerId}/name`).once('value');
        const reactorName = reactorSnapshot.val() || 'Someone';
        // Create notification payload
        const message = {
            token: fcmToken,
            notification: {
                title: 'Someone reacted to your image!',
                body: `${reactorName} ${reactionData.emoji} your contribution to the game.`,
            },
            data: {
                gameId: gameId,
                type: 'reaction',
                url: `/game/${gameId}`
            },
            webpush: {
                fcmOptions: {
                    link: `/game/${gameId}`
                }
            }
        };
        // Send the notification
        const response = await messaging.send(message);
        console.log(`[FCM] Reaction notification sent successfully:`, response);
    }
    catch (error) {
        console.error('[FCM] Error sending reaction notification:', error);
    }
});
/**
 * Store FCM token when a player subscribes to notifications
 */
exports.storeFCMToken = functions.https.onCall({
    cors: true,
    region: 'us-central1'
}, async (request) => {
    try {
        const { playerId, fcmToken } = request.data;
        if (!playerId || !fcmToken) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing playerId or fcmToken');
        }
        // Store the FCM token for the player
        await db.ref(`/players/${playerId}/fcmToken`).set(fcmToken);
        console.log(`[FCM] Token stored for player ${playerId}`);
        return { success: true };
    }
    catch (error) {
        console.error('[FCM] Error storing token:', error);
        throw new functions.https.HttpsError('internal', 'Failed to store FCM token');
    }
});
/**
 * Test function to send a test notification
 */
exports.sendTestNotification = functions.https.onCall({
    cors: true,
    region: 'us-central1'
}, async (request) => {
    try {
        const { fcmToken, title, body } = request.data;
        if (!fcmToken) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing fcmToken');
        }
        const message = {
            token: fcmToken,
            notification: {
                title: title || 'Test Notification',
                body: body || 'This is a test notification from Prompt Party!',
            },
            data: {
                type: 'test',
                url: '/'
            }
        };
        const response = await messaging.send(message);
        console.log(`[FCM] Test notification sent:`, response);
        return { success: true, messageId: response };
    }
    catch (error) {
        console.error('[FCM] Error sending test notification:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send test notification');
    }
});
console.log('[FCM] Firebase Functions initialized successfully');
//# sourceMappingURL=index.js.map