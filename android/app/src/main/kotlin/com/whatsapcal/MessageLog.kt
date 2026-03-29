package com.whatsapcal

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Simple in-memory + SharedPreferences log of processed messages.
 * Keeps the last 50 entries.
 */
object MessageLog {

    private const val PREFS_KEY = "message_log"
    private const val MAX_ENTRIES = 50

    data class LogEntry(
        val timestamp: Long,
        val sender: String,
        val message: String,
        val reply: String?,
    )

    fun add(context: Context, sender: String, message: String, reply: String?) {
        val prefs = context.getSharedPreferences(
            WhatsAppListenerService.PREFS_NAME, Context.MODE_PRIVATE
        )
        val existing = getAll(context).toMutableList()
        existing.add(0, LogEntry(System.currentTimeMillis(), sender, message, reply))

        // Trim to max
        val trimmed = existing.take(MAX_ENTRIES)

        val jsonArray = JSONArray()
        for (entry in trimmed) {
            jsonArray.put(JSONObject().apply {
                put("timestamp", entry.timestamp)
                put("sender",    entry.sender)
                put("message",   entry.message)
                put("reply",     entry.reply ?: JSONObject.NULL)
            })
        }

        prefs.edit().putString(PREFS_KEY, jsonArray.toString()).apply()
    }

    fun getAll(context: Context): List<LogEntry> {
        val prefs = context.getSharedPreferences(
            WhatsAppListenerService.PREFS_NAME, Context.MODE_PRIVATE
        )
        val json = prefs.getString(PREFS_KEY, "[]") ?: "[]"
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).map { i ->
                val obj = arr.getJSONObject(i)
                LogEntry(
                    timestamp = obj.getLong("timestamp"),
                    sender    = obj.getString("sender"),
                    message   = obj.getString("message"),
                    reply     = if (obj.isNull("reply")) null else obj.getString("reply"),
                )
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
}
