package com.pdxwise36.squirrelnote;

import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridges the web app's brain dump text into native SharedPreferences so the
 * home-screen widget (which can't read the WebView's own localStorage) has
 * something to show. squirrelnote.html calls this from saveBrainDumpNow()
 * -- see the feature-detected `window.Capacitor?.Plugins?.BrainDumpWidget`
 * call there -- so it's a no-op on the regular web deployment.
 */
@CapacitorPlugin(name = "BrainDumpWidget")
public class BrainDumpWidgetPlugin extends Plugin {

    @PluginMethod
    public void setText(PluginCall call) {
        String text = call.getString("text", "");
        SharedPreferences prefs = getContext().getSharedPreferences(
            BrainDumpWidgetProvider.PREFS_NAME, android.content.Context.MODE_PRIVATE
        );
        prefs.edit().putString(BrainDumpWidgetProvider.PREF_TEXT_KEY, text).apply();
        BrainDumpWidgetProvider.refreshAll(getContext());
        call.resolve(new JSObject());
    }
}
