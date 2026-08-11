package com.pdxwise36.squirrelnote;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BrainDumpWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    // MainActivity is launchMode="singleTask", so tapping the widget while
    // the app is already running arrives here instead of a fresh onCreate().
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra(BrainDumpWidgetProvider.EXTRA_OPEN_BRAINDUMP, false)) {
            openBrainDumpSoon(5);
        }
    }

    // Fires a window event squirrelnote.html listens for to open the brain
    // dump modal. On a warm start (app already running) the page and its
    // listener already exist, so this lands immediately. On a COLD start,
    // triggerJSEvent can fire before the remote page has finished loading
    // and registered the listener -- it's a plain evaluateJavascript call
    // with no built-in "wait until ready" queuing -- so this retries a few
    // times, 400ms apart, which is harmless once the real listener is
    // attached (a dispatched event with nothing listening is a no-op).
    private void openBrainDumpSoon(int retriesLeft) {
        getBridge().triggerJSEvent("snOpenBrainDump", "window");
        if (retriesLeft > 0) {
            new Handler(Looper.getMainLooper()).postDelayed(() -> openBrainDumpSoon(retriesLeft - 1), 400);
        }
    }
}
