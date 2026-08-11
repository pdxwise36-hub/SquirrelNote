package com.pdxwise36.squirrelnote;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/**
 * The home-screen widget. It only ever shows a short preview of the brain
 * dump and forwards a tap into the real app -- widgets can't host arbitrary
 * web content or live text input, so actual typing happens in the app.
 *
 * The preview text is written by BrainDumpWidgetPlugin (called from the web
 * app's saveBrainDumpNow(), so it tracks the same 300ms debounce already
 * used for the local save) rather than read from the WebView's own storage,
 * which isn't reachable from plain native code.
 */
public class BrainDumpWidgetProvider extends AppWidgetProvider {
    static final String PREFS_NAME = "braindump_widget_prefs";
    static final String PREF_TEXT_KEY = "text";
    static final String EXTRA_OPEN_BRAINDUMP = "open_braindump";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String text = prefs.getString(PREF_TEXT_KEY, "");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.braindump_widget);
        if (text == null || text.trim().isEmpty()) {
            views.setTextViewText(R.id.widget_preview, context.getString(R.string.braindump_widget_placeholder));
        } else {
            views.setTextViewText(R.id.widget_preview, text.trim());
        }

        Intent launch = new Intent(context, MainActivity.class);
        launch.setAction(Intent.ACTION_MAIN);
        launch.addCategory(Intent.CATEGORY_LAUNCHER);
        launch.putExtra(EXTRA_OPEN_BRAINDUMP, true);
        // FLAG_ACTIVITY_NEW_TASK is required to launch from a widget's
        // context; singleTask (already set on MainActivity in the manifest)
        // means this reuses the running app via onNewIntent() instead of
        // spawning a second instance.
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        // Unique request code per widget id so multiple placed widgets (if
        // ever more than one) don't collide and reuse each other's intent.
        PendingIntent pending = PendingIntent.getActivity(
            context, appWidgetId, launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pending);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /** Called by BrainDumpWidgetPlugin right after saving new text, so the
     *  widget updates within the same debounce window as the app's own
     *  save -- not just on the next scheduled updatePeriodMillis tick. */
    static void refreshAll(Context context) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        ComponentName me = new ComponentName(context, BrainDumpWidgetProvider.class);
        int[] ids = mgr.getAppWidgetIds(me);
        for (int id : ids) {
            updateWidget(context, mgr, id);
        }
    }
}
