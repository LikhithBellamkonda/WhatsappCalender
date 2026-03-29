package com.whatsapcal

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log

/**
 * Opens WhatsApp with a pre-filled reply message.
 * The user needs to tap Send — fully automated sending requires Accessibility Service.
 */
object WhatsAppReplyHelper {

    private val TAG = "WhatsAppReplyHelper"

    /**
     * Opens WhatsApp share intent with [replyText] pre-filled.
     * If [sender] is provided and looks like a phone number, attempts a direct chat deep-link.
     *
     * @param context   Application context
     * @param sender    Notification sender name (may or may not be a phone number)
     * @param replyText The pre-filled reply text
     */
    fun openWithReply(context: Context, sender: String, replyText: String) {
        // Try WhatsApp deep-link if sender is a phone number (digits + optional +, -, spaces)
        val phoneDigits = sender.filter { it.isDigit() }
        if (phoneDigits.length in 7..15) {
            // wa.me deep-link: opens a direct chat
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://wa.me/$phoneDigits?text=${Uri.encode(replyText)}")
                setPackage("com.whatsapp")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (intent.resolveActivity(context.packageManager) != null) {
                Log.d(TAG, "Opening WhatsApp direct chat with $phoneDigits")
                context.startActivity(intent)
                return
            }
        }

        // Fallback: generic share sheet (let user pick the right WhatsApp chat)
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type      = "text/plain"
            putExtra(Intent.EXTRA_TEXT, replyText)
            setPackage("com.whatsapp")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        if (shareIntent.resolveActivity(context.packageManager) != null) {
            Log.d(TAG, "Opening WhatsApp share intent (generic)")
            context.startActivity(shareIntent)
        } else {
            Log.w(TAG, "WhatsApp not installed or Intent could not be resolved")
        }
    }
    /**
     * Attempts to send a fully automated background reply using the Notification's RemoteInput.
     * This avoids opening the WhatsApp app UI.
     *
     * @param context Application context
     * @param sbn     The original StatusBarNotification that triggered this
     * @param replyText The text to send
     * @return true if an auto-reply action was found and fired, false otherwise.
     */
    fun sendAutoReply(context: Context, sbn: android.service.notification.StatusBarNotification, replyText: String): Boolean {
        val notification = sbn.notification
        val actions = notification.actions ?: return false

        for (action in actions) {
            val remoteInputs = action.remoteInputs
            if (remoteInputs != null && remoteInputs.isNotEmpty()) {
                val intent = Intent()
                val bundle = android.os.Bundle()
                for (remoteInput in remoteInputs) {
                    bundle.putCharSequence(remoteInput.resultKey, replyText)
                }
                android.app.RemoteInput.addResultsToIntent(remoteInputs, intent, bundle)

                try {
                    action.actionIntent.send(context, 0, intent)
                    Log.d(TAG, "✅ Fully automated background reply sent successfully!")
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to send auto-reply", e)
                }
            }
        }
        return false
    }
}
