package com.pdxwise36.squirrelnote;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import androidx.core.app.RemoteInput;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Handles a submitted lock-screen quick note. If a sync code is on file
 * (see QuickCapturePlugin.setSyncCode, called from squirrelnote.html
 * whenever the app's own sync setting changes), the note is saved straight
 * to that account in the cloud via the quick_note_append RPC -- no need for
 * the web app to ever actually run. If that fails (offline, no code on
 * file, a server hiccup), it falls back to queuing the text in
 * SharedPreferences instead, the same as before this existed -- see
 * QuickCapturePlugin.drain(), which turns queued entries into real notes
 * the next time the app actually opens. Either way, the notification is
 * re-posted right away so its reply box resets, ready for another note
 * immediately, the same way replying to a text message twice in a row
 * works -- that doesn't wait on the network call.
 */
public class QuickNoteReceiver extends BroadcastReceiver {
    static final String PREFS_NAME = "quicknote_prefs";
    static final String PREF_QUEUE_KEY = "queue";
    static final String PREF_SYNC_CODE_KEY = "sync_code";

    private static final String SYNC_URL = "https://dmsftllmpuwgcbdfmuso.supabase.co/rest/v1/rpc/quick_note_append";
    private static final String SYNC_KEY = "sb_publishable_f8TCzA2MDb1q2jKnvmrwFw_6mmYzGAR";

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle results = RemoteInput.getResultsFromIntent(intent);
        CharSequence text = results != null ? results.getCharSequence(QuickNoteNotification.KEY_TEXT_REPLY) : null;
        if (text != null && text.toString().trim().length() > 0) {
            final String noteText = text.toString().trim();
            final String syncCode = getSyncCode(context);
            final Context appContext = context.getApplicationContext();
            if (syncCode != null) {
                // A BroadcastReceiver's process can be killed the moment onReceive()
                // returns -- goAsync() buys this a window (well under Android's
                // ~30s ceiling for one HTTP call) to finish on a background thread
                // instead of blocking the caller (and violating the
                // no-network-on-the-main-thread rule) right here.
                final PendingResult pending = goAsync();
                new Thread(() -> {
                    boolean saved = tryCloudAppend(syncCode, noteText);
                    if (!saved) enqueue(appContext, noteText);
                    pending.finish();
                }).start();
            } else {
                enqueue(appContext, noteText);
            }
        }
        QuickNoteNotification.post(context);
    }

    private String getSyncCode(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String code = prefs.getString(PREF_SYNC_CODE_KEY, null);
        return (code == null || code.isEmpty()) ? null : code;
    }

    private boolean tryCloudAppend(String code, String text) {
        HttpURLConnection conn = null;
        try {
            JSONObject body = new JSONObject();
            body.put("p_code", code);
            body.put("p_text", text);
            URL url = new URL(SYNC_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("apikey", SYNC_KEY);
            conn.setRequestProperty("Authorization", "Bearer " + SYNC_KEY);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }
            int status = conn.getResponseCode();
            return status >= 200 && status < 300;
        } catch (Exception e) {
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private void enqueue(Context context, String text) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(PREF_QUEUE_KEY, "[]");
        JSONArray arr;
        try { arr = new JSONArray(raw); } catch (JSONException e) { arr = new JSONArray(); }
        arr.put(text);
        prefs.edit().putString(PREF_QUEUE_KEY, arr.toString()).apply();
    }
}
