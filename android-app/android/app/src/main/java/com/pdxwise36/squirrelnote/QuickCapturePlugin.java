package com.pdxwise36.squirrelnote;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONException;

/**
 * Hands off whatever was typed into the lock-screen "Quick note" notification
 * (see QuickNoteReceiver) to the web app. Notes captured while the app
 * wasn't running are queued in SharedPreferences by the receiver; this
 * plugin drains that queue once, on startup, so squirrelnote.html can turn
 * each one into a real note. No-op (empty array) on the regular web
 * deployment, where this plugin doesn't exist.
 */
@CapacitorPlugin(name = "QuickCapture")
public class QuickCapturePlugin extends Plugin {

    @PluginMethod
    public void drain(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(QuickNoteReceiver.PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(QuickNoteReceiver.PREF_QUEUE_KEY, "[]");
        JSArray notes = new JSArray();
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) notes.put(arr.getString(i));
        } catch (JSONException e) {
            // Corrupt queue -- drop it rather than get stuck resurfacing garbage forever.
        }
        prefs.edit().remove(QuickNoteReceiver.PREF_QUEUE_KEY).apply();
        JSObject result = new JSObject();
        result.put("notes", notes);
        call.resolve(result);
    }
}
