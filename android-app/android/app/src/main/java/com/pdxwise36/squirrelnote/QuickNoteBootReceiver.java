package com.pdxwise36.squirrelnote;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Re-shows the quick-note notification after a reboot (or an app update,
 * which also clears standing notifications) -- otherwise it would only come
 * back the next time you happened to open the app yourself.
 */
public class QuickNoteBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        QuickNoteNotification.post(context);
    }
}
