package com.whatsapcal

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.text.format.DateFormat
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.switchmaterial.SwitchMaterial
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.button.MaterialButton
import java.util.Date

import java.util.UUID
import android.net.Uri

class MainActivity : AppCompatActivity() {

    private val prefs by lazy {
        getSharedPreferences(WhatsAppListenerService.PREFS_NAME, Context.MODE_PRIVATE)
    }

    private lateinit var switchEnabled: SwitchMaterial
    private lateinit var etBackendUrl: TextInputEditText
    private lateinit var btnSave: MaterialButton
    private lateinit var btnConnectCalendar: MaterialButton
    private lateinit var btnGrantAccess: MaterialButton
    private lateinit var rvLogs: RecyclerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        switchEnabled    = findViewById(R.id.switchEnabled)
        etBackendUrl     = findViewById(R.id.etBackendUrl)
        btnSave          = findViewById(R.id.btnSave)
        btnConnectCalendar = findViewById(R.id.btnConnectCalendar)
        btnGrantAccess   = findViewById(R.id.btnGrantAccess)
        rvLogs           = findViewById(R.id.rvLogs)

        // Ensure a unique userId exists for this app installation
        var userId = prefs.getString(WhatsAppListenerService.PREF_USER_ID, null)
        if (userId == null) {
            userId = UUID.randomUUID().toString()
            prefs.edit().putString(WhatsAppListenerService.PREF_USER_ID, userId).apply()
        }

        // Restore saved values
        switchEnabled.isChecked = prefs.getBoolean(WhatsAppListenerService.PREF_ENABLED, false)
        etBackendUrl.setText(prefs.getString(WhatsAppListenerService.PREF_BACKEND_URL, "http://192.168.1.100:3000"))

        // Toggle listener
        switchEnabled.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean(WhatsAppListenerService.PREF_ENABLED, isChecked).apply()
            if (isChecked && !isNotificationListenerEnabled()) {
                switchEnabled.isChecked = false
                prefs.edit().putBoolean(WhatsAppListenerService.PREF_ENABLED, false).apply()
                showNotificationAccessDialog()
            }
        }

        // Save backend URL
        btnSave.setOnClickListener {
            val url = etBackendUrl.text?.toString()?.trim() ?: ""
            if (url.isBlank()) {
                Toast.makeText(this, "Please enter a valid backend URL", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            prefs.edit().putString(WhatsAppListenerService.PREF_BACKEND_URL, url).apply()
            Toast.makeText(this, "✅ Backend URL saved", Toast.LENGTH_SHORT).show()
        }

        // Connect Calendar via Browser
        btnConnectCalendar.setOnClickListener {
            val url = etBackendUrl.text?.toString()?.trim() ?: ""
            if (url.isBlank()) {
                Toast.makeText(this, "Save a backend URL first", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val authUrl = "${url.trimEnd('/')}/auth?userId=$userId"
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(authUrl))
            startActivity(intent)
        }

        // Grant notification access
        btnGrantAccess.setOnClickListener {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }

        // Setup log RecyclerView
        rvLogs.layoutManager = LinearLayoutManager(this)
        refreshLogs()
    }

    override fun onResume() {
        super.onResume()
        refreshLogs()
    }

    private fun refreshLogs() {
        val logs = MessageLog.getAll(this)
        rvLogs.adapter = LogAdapter(logs)
    }

    private fun isNotificationListenerEnabled(): Boolean {
        val cn = ComponentName(this, WhatsAppListenerService::class.java)
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        return flat?.contains(cn.flattenToString()) == true
    }

    private fun showNotificationAccessDialog() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Notification Access Required")
            .setMessage(
                "This app needs Notification Access to read WhatsApp messages.\n\n" +
                "Tap 'Open Settings', then enable 'WhatsApp Calendar' in the list."
            )
            .setPositiveButton("Open Settings") { _, _ ->
                startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // ── Log RecyclerView Adapter ─────────────────────────────────────────────

    class LogAdapter(private val items: List<MessageLog.LogEntry>) :
        RecyclerView.Adapter<LogAdapter.VH>() {

        class VH(view: View) : RecyclerView.ViewHolder(view) {
            val tvMeta: TextView    = view.findViewById(R.id.tvMeta)
            val tvMessage: TextView = view.findViewById(R.id.tvMessage)
            val tvReply: TextView   = view.findViewById(R.id.tvReply)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = VH(
            LayoutInflater.from(parent.context).inflate(R.layout.item_log, parent, false)
        )

        override fun getItemCount() = items.size

        override fun onBindViewHolder(holder: VH, position: Int) {
            val entry = items[position]
            val time  = DateFormat.format("dd MMM, hh:mm a", Date(entry.timestamp))
            holder.tvMeta.text    = "📩 ${entry.sender}  ·  $time"
            holder.tvMessage.text = entry.message
            holder.tvReply.text   = entry.reply ?: "— Not a meeting message"
        }
    }
}
