package com.pdxwise36.squirrelnote;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import androidx.core.app.RemoteInput;
import org.json.JSONArray;
import org.json.JSONException;

/**
 * Handles a submitted lock-screen quick note. The web app isn't necessarily
 * running to save it directly, so the text is queued in SharedPreferences
 * -- see QuickCapturePlugin, which drains this queue into real notes the
 * next time the app actually opens -- then the notification is re-posted so
 * its reply box resets, ready for another note right away, the same way
 * replying to a text message twice in a row works.
 */
public class QuickNoteReceiver extends BroadcastReceiver {
    static final String PREFS_NAME = "quicknote_prefs";
    static final String PREF_QUEUE_KEY = "queue";

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle results = RemoteInput.getResultsFromIntent(intent);
        CharSequence text = results != null ? results.getCharSequence(QuickNoteNotification.KEY_TEXT_REPLY) : null;
        if (text != null && text.toString().trim().length() > 0) {
            enqueue(context, text.toString().trim());
        }
        QuickNoteNotification.post(context);
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
