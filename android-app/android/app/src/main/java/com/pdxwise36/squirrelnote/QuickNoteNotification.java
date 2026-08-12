package com.pdxwise36.squirrelnote;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;

/**
 * Posts (and re-posts) the always-there "Quick note" notification that lets
 * you jot something down straight from the lock screen -- no unlocking, no
 * opening the app -- using Android's own reply-to-notification mechanism,
 * the same one messaging apps use to let you answer a text without opening
 * it. See QuickNoteReceiver for what happens when you actually submit one.
 */
class QuickNoteNotification {
    static final String CHANNEL_ID = "quick_note";
    static final int NOTIFICATION_ID = 1001;
    static final String KEY_TEXT_REPLY = "quick_note_text";

    private static void ensureChannel(Context ctx, NotificationManager mgr) {
        if (mgr.getNotificationChannel(CHANNEL_ID) == null) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Quick note", NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("A standing notification so you can jot down a quick note without unlocking your phone.");
            channel.setShowBadge(false);
            mgr.createNotificationChannel(channel);
        }
    }

    // Safe to call any time (app launch, after a note is submitted, after a
    // reboot) -- posting again just resets the reply box. If the
    // POST_NOTIFICATIONS permission (Android 13+) hasn't been granted yet
    // this silently does nothing rather than crash; MainActivity asks for
    // it on first launch, and the boot/launch calls here catch it up once
    // it's granted.
    static void post(Context ctx) {
        NotificationManager mgr = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (mgr == null) return;
        ensureChannel(ctx, mgr);

        RemoteInput remoteInput = new RemoteInput.Builder(KEY_TEXT_REPLY)
            .setLabel("Type a quick note…")
            .build();

        Intent intent = new Intent(ctx, QuickNoteReceiver.class);
        PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
            ctx, 0, intent,
            PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Action action = new NotificationCompat.Action.Builder(
            android.R.drawable.ic_input_add, "Quick note", replyPendingIntent
        ).addRemoteInput(remoteInput).build();

        Notification notification = new NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher_monochrome)
            .setContentTitle("SquirrelNote")
            .setContentText("Tap Quick note to jot something down")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(action)
            .build();

        try {
            mgr.notify(NOTIFICATION_ID, notification);
        } catch (SecurityException e) {
            // POST_NOTIFICATIONS not granted yet -- fine, this gets retried
            // the next time post() is called (permission grant, next launch).
        }
    }
}
