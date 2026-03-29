package com.whatsapcal

import android.app.Notification
import android.content.Context
import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Listens for incoming WhatsApp notifications.
 * When a new message arrives, it sends the text to the backend for AI processing.
 */
class WhatsAppListenerService : NotificationListenerService() {

    private val TAG = "WhatsAppListener"
    private val WHATSAPP_PACKAGE = "com.whatsapp"

    // Coroutine scope tied to the service lifetime
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        // Filter: only process WhatsApp notifications
        if (sbn.packageName != WHATSAPP_PACKAGE) return

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isEnabled = prefs.getBoolean(PREF_ENABLED, false)
        val backendUrl = prefs.getString(PREF_BACKEND_URL, "") ?: ""
        val userId = prefs.getString(PREF_USER_ID, "") ?: ""

        if (!isEnabled || backendUrl.isBlank() || userId.isBlank()) {
            Log.d(TAG, "Service disabled, incomplete setup, or backend URL not set. Ignoring notification.")
            return
        }

        val extras = sbn.notification.extras
        val sender  = extras.getString(Notification.EXTRA_TITLE) ?: "Unknown"
        val message = extras.getString(Notification.EXTRA_TEXT)  ?: return

        // Ignore group summary / collapsed notifications
        if (message.isBlank() || sbn.notification.flags and Notification.FLAG_GROUP_SUMMARY != 0) return

        Log.d(TAG, "📩 New WhatsApp message from $sender: $message")

        // Fire-and-forget coroutine to avoid blocking the main thread
        serviceScope.launch {
            try {
                val result = BackendApiService.process(backendUrl, sender, message, userId)
                if (result != null) {
                    Log.d(TAG, "✅ Backend responded. Reply: ${result.reply}")

                    // Log event
                    MessageLog.add(applicationContext, sender, message, result.reply)

                    // Attempt background auto-reply first 
                    if (result.reply != null) {
                        val sent = WhatsAppReplyHelper.sendAutoReply(applicationContext, sbn, result.reply)
                        if (!sent) {
                            Log.w(TAG, "Background reply failed, falling back to opening WhatsApp UI")
                            WhatsAppReplyHelper.openWithReply(applicationContext, sender, result.reply)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing message: ${e.message}", e)
            }
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // No action needed
    }

    companion object {
        const val PREFS_NAME        = "whatsapcal_prefs"
        const val PREF_ENABLED      = "enabled"
        const val PREF_BACKEND_URL  = "backend_url"
        const val PREF_USER_ID      = "user_id"
    }
}
