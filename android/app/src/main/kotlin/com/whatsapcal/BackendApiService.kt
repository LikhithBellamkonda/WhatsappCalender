package com.whatsapcal

import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Sends a WhatsApp message to the backend /process endpoint and returns the result.
 */
object BackendApiService {

    private val TAG = "BackendApiService"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()

    data class ProcessResult(
        val isSchedulable: Boolean,
        val reply: String?,
        val meetLink: String?,
        val eventLink: String?,
    )

    /**
     * Posts the message to the backend and returns a [ProcessResult], or null on failure.
     * Must be called from a background thread / coroutine.
     */
    fun process(backendUrl: String, sender: String, message: String, userId: String): ProcessResult? {
        val url = "${backendUrl.trimEnd('/')}/process"

        val body = JSONObject().apply {
            put("sender", sender)
            put("message", message)
            put("userId", userId)
        }.toString().toRequestBody(JSON_MEDIA_TYPE)

        val request = Request.Builder()
            .url(url)
            .post(body)
            .build()

        return try {
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                Log.e(TAG, "Backend returned HTTP ${response.code}")
                return null
            }

            val json = JSONObject(response.body?.string() ?: return null)
            ProcessResult(
                isSchedulable = json.optBoolean("isSchedulable", false),
                reply         = if (json.isNull("reply")) null else json.optString("reply"),
                meetLink      = if (json.isNull("meetLink")) null else json.optString("meetLink"),
                eventLink     = if (json.isNull("eventLink")) null else json.optString("eventLink"),
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to reach backend at $url: ${e.message}")
            null
        }
    }
}
